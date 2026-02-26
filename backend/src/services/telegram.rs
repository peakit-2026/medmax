use sqlx::PgPool;
use teloxide::prelude::*;
use teloxide::types::ChatId;
use teloxide::utils::command::BotCommands;
use uuid::Uuid;

use crate::models::checklist::ChecklistItem;
use crate::models::patient::Patient;
use crate::models::telegram::TelegramSubscription;

#[derive(BotCommands, Clone)]
#[command(rename_rule = "lowercase")]
enum Command {
    #[command(description = "Подписаться: /start <код доступа>")]
    Start(String),
    #[command(description = "Проверить статус подготовки")]
    Status,
    #[command(description = "Список команд")]
    Help,
}

async fn handle_command(bot: Bot, msg: Message, cmd: Command, pool: PgPool) -> ResponseResult<()> {
    match cmd {
        Command::Start(code) => {
            let code = code.trim().to_string();
            if code.is_empty() {
                bot.send_message(msg.chat.id, "Укажите код доступа: /start <код>")
                    .await?;
                return Ok(());
            }

            match Patient::find_by_access_code(&pool, &code).await {
                Ok(Some(patient)) => {
                    match TelegramSubscription::create(&pool, patient.id, msg.chat.id.0).await {
                        Ok(_) => {
                            bot.send_message(
                                msg.chat.id,
                                format!(
                                    "Вы подписаны на уведомления для пациента {}.",
                                    patient.full_name
                                ),
                            )
                            .await?;
                        }
                        Err(_) => {
                            bot.send_message(msg.chat.id, "Ошибка при подписке. Попробуйте позже.")
                                .await?;
                        }
                    }
                }
                Ok(None) => {
                    bot.send_message(msg.chat.id, "Пациент с таким кодом не найден.")
                        .await?;
                }
                Err(_) => {
                    bot.send_message(msg.chat.id, "Ошибка базы данных.").await?;
                }
            }
        }
        Command::Status => {
            let chat_id = msg.chat.id.0;
            match TelegramSubscription::find_by_chat_id(&pool, chat_id).await {
                Ok(Some(sub)) => {
                    let patient = Patient::find_by_id(&pool, sub.patient_id).await;
                    let checklist = ChecklistItem::list_by_patient(&pool, sub.patient_id).await;

                    let mut text = String::new();

                    if let Ok(Some(p)) = patient {
                        text.push_str(&format!("Пациент: {}\n", p.full_name));
                        text.push_str(&format!("Статус: {}\n", p.status));
                        if let Some(date) = p.operation_date {
                            text.push_str(&format!("Дата операции: {}\n", date));
                        }
                    }

                    if let Ok(items) = checklist {
                        let total = items.len();
                        let done = items.iter().filter(|i| i.is_completed).count();
                        text.push_str(&format!("\nЧек-лист: {} из {} выполнено", done, total));
                        for item in &items {
                            let mark = if item.is_completed { "+" } else { "-" };
                            text.push_str(&format!("\n [{}] {}", mark, item.title));
                        }
                    }

                    if text.is_empty() {
                        text = "Нет данных.".to_string();
                    }

                    bot.send_message(msg.chat.id, text).await?;
                }
                Ok(None) => {
                    bot.send_message(
                        msg.chat.id,
                        "Вы не подписаны. Используйте /start <код доступа>.",
                    )
                    .await?;
                }
                Err(_) => {
                    bot.send_message(msg.chat.id, "Ошибка базы данных.").await?;
                }
            }
        }
        Command::Help => {
            bot.send_message(msg.chat.id, Command::descriptions().to_string())
                .await?;
        }
    }
    Ok(())
}

fn make_bot(token: String) -> Bot {
    let mut bot = Bot::new(token);
    let api_url = std::env::var("TELEGRAM_API_URL")
        .unwrap_or_else(|_| "https://proxy.accordai.ru/telegram/".to_string());
    if let Ok(url) = api_url.parse() {
        bot = bot.set_api_url(url);
    }
    bot
}

pub async fn start_bot(pool: PgPool) {
    let token = match std::env::var("TELEGRAM_BOT_TOKEN") {
        Ok(t) if !t.is_empty() => t,
        _ => {
            log::warn!("TELEGRAM_BOT_TOKEN not set, bot disabled");
            return;
        }
    };

    let bot = make_bot(token);

    let handler = Update::filter_message()
        .filter_command::<Command>()
        .endpoint(handle_command);

    Dispatcher::builder(bot, handler)
        .dependencies(dptree::deps![pool])
        .enable_ctrlc_handler()
        .build()
        .dispatch()
        .await;
}

pub async fn notify_patient(pool: &PgPool, patient_id: Uuid, message: &str) {
    let token = match std::env::var("TELEGRAM_BOT_TOKEN") {
        Ok(t) if !t.is_empty() => t,
        _ => return,
    };
    let bot = make_bot(token);

    if let Ok(Some(sub)) = TelegramSubscription::find_by_patient(pool, patient_id).await {
        let _ = bot.send_message(ChatId(sub.chat_id), message).send().await;
    }
}
