# Data Flow Diagram CyberShield

## DFD Pekan 3

```mermaid
flowchart LR

    subgraph TB1["Trust Boundary TB-01: User Device / Browser"]
        E01[External Entity E01: Pengguna]
    end

    subgraph TB2["Trust Boundary TB-02: CyberShield Application"]
        P01[Process P01: Input & Validasi URL]
        P02[Process P02: Analisis Risiko URL]
        P03[Process P03: Generate Hasil Analisis]

        D01[(Data Store D01: Aturan Deteksi)]
        D02[(Data Store D02: Mock/Sample URL)]
    end

    E01 -->|F01: URL yang akan dianalisis| P01
    P01 -->|F02: Pesan validasi| E01
    P01 -->|F03: URL valid| P02

    D01 -->|F04: Aturan HTTPS, TLD, keyword, extension| P02
    D02 -->|F05: Contoh URL| P01

    P02 -->|F06: Indikator risiko & risk score| P03
    P03 -->|F07: Hasil analisis & rekomendasi| E01