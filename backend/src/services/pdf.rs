use printpdf::*;
use std::io::BufWriter;

fn load_cyrillic_font(doc: &PdfDocumentReference) -> IndirectFontRef {
    let paths = [
        "/usr/share/fonts/liberation/LiberationSans-Regular.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/usr/share/fonts/TTF/LiberationSans-Regular.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/dejavu-sans-fonts/DejaVuSans.ttf",
        "/usr/share/fonts/TTF/DejaVuSans.ttf",
    ];

    for path in &paths {
        if let Ok(bytes) = std::fs::read(path)
            && let Ok(font) = doc.add_external_font(bytes.as_slice())
        {
            return font;
        }
    }

    doc.add_builtin_font(BuiltinFont::Helvetica).unwrap()
}

fn load_bold_font(doc: &PdfDocumentReference) -> IndirectFontRef {
    let paths = [
        "/usr/share/fonts/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/TTF/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/dejavu-sans-fonts/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf",
    ];

    for path in &paths {
        if let Ok(bytes) = std::fs::read(path)
            && let Ok(font) = doc.add_external_font(bytes.as_slice())
        {
            return font;
        }
    }

    doc.add_builtin_font(BuiltinFont::HelveticaBold).unwrap()
}

pub struct RouteSheetParams<'a> {
    pub patient_name: &'a str,
    pub birth_date: &'a str,
    pub snils: &'a str,
    pub insurance: &'a str,
    pub diagnosis: &'a str,
    pub operation_type: &'a str,
    pub checklist_items: &'a [String],
    pub access_code: &'a str,
    pub generation_date: &'a str,
}

pub fn generate_route_sheet(params: &RouteSheetParams<'_>) -> Vec<u8> {
    let (doc, page1, layer1) = PdfDocument::new("Route Sheet", Mm(210.0), Mm(297.0), "Layer 1");
    let layer = doc.get_page(page1).get_layer(layer1);

    let font = load_cyrillic_font(&doc);
    let bold_font = load_bold_font(&doc);

    let mut y = Mm(272.0);
    let left = Mm(20.0);
    let line_height = Mm(7.0);

    layer.use_text(
        "\u{041C}\u{0410}\u{0420}\u{0428}\u{0420}\u{0423}\u{0422}\u{041D}\u{042B}\u{0419} \u{041B}\u{0418}\u{0421}\u{0422} \u{041F}\u{0410}\u{0426}\u{0418}\u{0415}\u{041D}\u{0422}\u{0410}",
        16.0,
        Mm(40.0),
        y,
        &bold_font,
    );
    y -= Mm(8.0);

    layer.use_text(
        "\u{0420}\u{0435}\u{0433}\u{0438}\u{043E}\u{043D}\u{0430}\u{043B}\u{044C}\u{043D}\u{044B}\u{0439} \u{043E}\u{0444}\u{0442}\u{0430}\u{043B}\u{044C}\u{043C}\u{043E}\u{043B}\u{043E}\u{0433}\u{0438}\u{0447}\u{0435}\u{0441}\u{043A}\u{0438}\u{0439} \u{0446}\u{0435}\u{043D}\u{0442}\u{0440}",
        10.0,
        Mm(55.0),
        y,
        &font,
    );
    y -= Mm(15.0);

    let separator = "\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}\u{2500}";
    layer.use_text(separator, 8.0, left, y, &font);
    y -= Mm(10.0);

    let info_lines = [
        format!("\u{0424}\u{0418}\u{041E}: {}", params.patient_name),
        format!(
            "\u{0414}\u{0430}\u{0442}\u{0430} \u{0440}\u{043E}\u{0436}\u{0434}\u{0435}\u{043D}\u{0438}\u{044F}: {}",
            params.birth_date
        ),
        format!("\u{0421}\u{041D}\u{0418}\u{041B}\u{0421}: {}", params.snils),
        format!(
            "\u{041F}\u{043E}\u{043B}\u{0438}\u{0441} \u{041E}\u{041C}\u{0421}: {}",
            params.insurance
        ),
        format!(
            "\u{0414}\u{0438}\u{0430}\u{0433}\u{043D}\u{043E}\u{0437}: {}",
            params.diagnosis
        ),
        format!(
            "\u{0422}\u{0438}\u{043F} \u{043E}\u{043F}\u{0435}\u{0440}\u{0430}\u{0446}\u{0438}\u{0438}: {}",
            params.operation_type
        ),
    ];

    for line in &info_lines {
        layer.use_text(line.as_str(), 11.0, left, y, &font);
        y -= line_height;
    }

    y -= Mm(8.0);
    layer.use_text(separator, 8.0, left, y, &font);
    y -= Mm(10.0);

    layer.use_text(
        "\u{041D}\u{0435}\u{043E}\u{0431}\u{0445}\u{043E}\u{0434}\u{0438}\u{043C}\u{044B}\u{0435} \u{043E}\u{0431}\u{0441}\u{043B}\u{0435}\u{0434}\u{043E}\u{0432}\u{0430}\u{043D}\u{0438}\u{044F}:",
        12.0,
        left,
        y,
        &bold_font,
    );
    y -= Mm(10.0);

    for item in params.checklist_items {
        let line = format!("\u{2610}  {}", item);
        layer.use_text(line.as_str(), 11.0, Mm(25.0), y, &font);
        y -= line_height;

        if y < Mm(30.0) {
            break;
        }
    }

    y -= Mm(10.0);
    layer.use_text(separator, 8.0, left, y, &font);
    y -= Mm(10.0);

    let code_line = format!(
        "\u{041A}\u{043E}\u{0434} \u{0434}\u{043E}\u{0441}\u{0442}\u{0443}\u{043F}\u{0430} \u{0434}\u{043B}\u{044F} \u{043F}\u{0440}\u{043E}\u{0432}\u{0435}\u{0440}\u{043A}\u{0438} \u{0441}\u{0442}\u{0430}\u{0442}\u{0443}\u{0441}\u{0430}: {}",
        params.access_code
    );
    layer.use_text(code_line.as_str(), 11.0, left, y, &bold_font);
    y -= line_height;

    let url_line = format!("https://yarokb.ru/patient/{}", params.access_code);
    layer.use_text(url_line.as_str(), 9.0, left, y, &font);
    y -= Mm(15.0);

    let date_line = format!(
        "\u{0414}\u{0430}\u{0442}\u{0430} \u{0444}\u{043E}\u{0440}\u{043C}\u{0438}\u{0440}\u{043E}\u{0432}\u{0430}\u{043D}\u{0438}\u{044F}: {}",
        params.generation_date
    );
    layer.use_text(date_line.as_str(), 9.0, left, y, &font);

    let mut buf = BufWriter::new(Vec::new());
    doc.save(&mut buf).unwrap();
    buf.into_inner().unwrap()
}
