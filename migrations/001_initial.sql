CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('doctor', 'surgeon', 'patient')),
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    district VARCHAR(255),
    organization VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES users(id),
    surgeon_id UUID REFERENCES users(id),
    full_name VARCHAR(255) NOT NULL,
    birth_date DATE NOT NULL,
    snils VARCHAR(14),
    insurance_policy VARCHAR(30),
    diagnosis_code VARCHAR(10) NOT NULL,
    diagnosis_text VARCHAR(500) NOT NULL,
    operation_type VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'red' CHECK (status IN ('red', 'yellow', 'green')),
    access_code VARCHAR(8) UNIQUE NOT NULL,
    operation_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    item_type VARCHAR(30) NOT NULL CHECK (item_type IN ('file_upload', 'date_input', 'calculator', 'checkbox')),
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    file_path VARCHAR(500),
    value_json JSONB,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE iol_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    eye VARCHAR(5) NOT NULL CHECK (eye IN ('left', 'right')),
    k1 DOUBLE PRECISION NOT NULL,
    k2 DOUBLE PRECISION NOT NULL,
    axial_length DOUBLE PRECISION NOT NULL,
    acd DOUBLE PRECISION NOT NULL,
    target_refraction DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    formula VARCHAR(20) NOT NULL,
    recommended_iol DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE media_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    checklist_item_id UUID REFERENCES checklist_items(id),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE telegram_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    chat_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO users (id, email, password_hash, role, full_name, district, organization) VALUES
('a0000000-0000-0000-0000-000000000001', 'doctor@demo.ru', '$2b$12$CpiePsgTTYqS1cjrd5a.5.q492bS55MTkFUdVkX5pPImli26XJ46.', 'doctor', 'Иванов Петр Сергеевич', 'Краснохолмский район', 'ФАП с. Краснохолм'),
('a0000000-0000-0000-0000-000000000002', 'surgeon@demo.ru', '$2b$12$CpiePsgTTYqS1cjrd5a.5.q492bS55MTkFUdVkX5pPImli26XJ46.', 'surgeon', 'Смирнова Анна Викторовна', NULL, 'Областной офтальмологический центр'),
('a0000000-0000-0000-0000-000000000003', 'patient@demo.ru', '$2b$12$CpiePsgTTYqS1cjrd5a.5.q492bS55MTkFUdVkX5pPImli26XJ46.', 'patient', 'Козлов Михаил Андреевич', NULL, NULL);
