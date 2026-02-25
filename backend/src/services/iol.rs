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
