pub fn srk_t(al: f64, k_avg: f64, a_constant: f64, target_ref: f64) -> f64 {
    let r = 337.5 / k_avg;

    let lcor = al + 0.25 * (al - 23.45).max(0.0);

    let cw = -5.40948 + 0.58412 * lcor + 0.098 * k_avg;
    let ach_est = 0.62467 * a_constant - 68.747;

    let corneal_width_sq = cw * cw / 4.0;
    let rr = r * r;
    let h = r - (rr - corneal_width_sq).max(0.0).sqrt() + ach_est - 3.336;

    let na = 1.336;
    let nc = 0.333;
    let optical_al = al;

    let denominator = (optical_al - h) * (na * r - nc * h);
    if denominator.abs() < 0.001 {
        return 0.0;
    }

    let iol = (1000.0 * na * (na * r - nc * optical_al) - h * (na * r - nc * h)) / denominator;

    let adjusted = iol - target_ref * (1.0 / (1.0 - 0.012 * target_ref));

    (adjusted * 2.0).round() / 2.0
}

pub fn holladay_1(al: f64, k_avg: f64, a_constant: f64, target_ref: f64) -> f64 {
    let sf = 0.5663 * a_constant - 65.6;
    let r = 337.5 / k_avg;
    let ag = 12.5 * al / 23.45;

    let r_sq = r * r;
    let ag_sq = ag * ag / 4.0;
    let s = r - (r_sq - ag_sq).max(0.0).sqrt() + sf;

    let na = 1.336;
    let optical_al = al;

    let v = 12.0;
    let dr = target_ref / (1.0 - v / 1000.0 * target_ref);

    let numerator = 1000.0 * na * (na * r - (na - 1.0) * optical_al)
        - s * (na * r - (na - 1.0) * s);
    let denominator = (optical_al - s) * (na * r - (na - 1.0) * s);

    if denominator.abs() < 0.001 {
        return 0.0;
    }

    let iol = numerator / denominator - dr;

    (iol * 2.0).round() / 2.0
}

pub fn hoffer_q(al: f64, k_avg: f64, a_constant: f64, target_ref: f64) -> f64 {
    let pacd = 0.5663 * a_constant - 65.6;

    let m = if al <= 23.0 { 1.0 } else { -1.0 };
    let g = 28.0 - al;
    let acd_adj = pacd + 0.3 * (al - 23.5) + (al.powi(2) * 0.1).tanh()
        - 0.99166 + 0.1 * m * (g * g * 0.04 - 0.25).max(0.0).sqrt();

    let r = 337.5 / k_avg;
    let na = 1.336;
    let v = 12.0;

    let dr = target_ref / (1.0 - v / 1000.0 * target_ref);

    let top = 1000.0 * na * (na * r - (na - 1.0) * al) - acd_adj * (na * r - (na - 1.0) * acd_adj);
    let bottom = (al - acd_adj) * (na * r - (na - 1.0) * acd_adj);

    if bottom.abs() < 0.001 {
        return 0.0;
    }

    let iol = top / bottom - dr;

    (iol * 2.0).round() / 2.0
}

pub fn haigis(al: f64, _k_avg: f64, acd: f64, a0: f64, a1: f64, a2: f64, target_ref: f64) -> f64 {
    let d = a0 + a1 * acd + a2 * al;
    let na = 1.336;
    let retinal_thickness = 0.65696 - 0.02029 * al;
    let optical_al = al + retinal_thickness;

    let z = na / (optical_al - d);
    let vertex_factor = if (1000.0 - 12.0 * target_ref).abs() < 0.001 {
        0.0
    } else {
        target_ref / (1000.0 / (1000.0 - 12.0 * target_ref))
    };

    let inner = 1.0 / (z + vertex_factor) - d / na;
    if inner.abs() < 0.0001 {
        return 0.0;
    }

    let iol_power = z - 1.0 / inner;

    (iol_power * 2.0).round() / 2.0
}
