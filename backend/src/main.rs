mod middleware;
mod models;
mod routes;
mod services;

use actix_cors::Cors;
use actix_web::{web, App, HttpResponse, HttpServer};
use sqlx::postgres::PgPoolOptions;

#[derive(Clone)]
pub struct AppState {
    pub db: sqlx::PgPool,
    pub jwt_secret: String,
    pub upload_dir: String,
}

async fn health_check() -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({"status": "ok"}))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenvy::dotenv().ok();
    env_logger::init();

    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");
    let jwt_secret = std::env::var("JWT_SECRET")
        .expect("JWT_SECRET must be set");
    let upload_dir = std::env::var("UPLOAD_DIR")
        .unwrap_or_else(|_| "./uploads".to_string());

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to create pool");

    sqlx::migrate!("../migrations")
        .run(&pool)
        .await
        .expect("Failed to run migrations");

    let state = AppState {
        db: pool,
        jwt_secret,
        upload_dir,
    };

    log::info!("Starting server at http://0.0.0.0:8080");

    HttpServer::new(move || {
        let cors = Cors::permissive();

        App::new()
            .wrap(cors)
            .app_data(web::Data::new(state.clone()))
            .route("/api/health", web::get().to(health_check))
            .service(
                web::scope("/api/auth")
                    .route("/login", web::post().to(routes::auth::login))
                    .route("/register", web::post().to(routes::auth::register))
                    .route("/me", web::get().to(routes::auth::me)),
            )
            .service(
                web::scope("/api/patients")
                    .route("", web::get().to(routes::patients::list))
                    .route("", web::post().to(routes::patients::create))
                    .route("/code/{code}", web::get().to(routes::patients::get_by_code))
                    .route("/{id}", web::get().to(routes::patients::get))
                    .route("/{id}", web::put().to(routes::patients::update)),
            )
            .service(
                web::scope("/api/checklists")
                    .route("/{id}/complete", web::put().to(routes::checklists::complete))
                    .route("/{id}/uncomplete", web::put().to(routes::checklists::uncomplete))
                    .route("/{id}/upload", web::post().to(routes::checklists::upload)),
            )
            .service(
                web::scope("/api/iol")
                    .route("/calculate", web::post().to(routes::iol::calculate))
                    .route("/patient/{patient_id}", web::get().to(routes::iol::list_by_patient)),
            )
    })
    .bind("0.0.0.0:8080")?
    .run()
    .await
}
