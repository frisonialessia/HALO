export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "20px",
      }}
    >
      <p
        style={{
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--deep)",
        }}
      >
        AEO · LLMO · Local Intelligence
      </p>
      <h1
        style={{
          fontSize: "56px",
          fontWeight: 800,
          letterSpacing: "-0.04em",
          lineHeight: 0.98,
          maxWidth: "640px",
          marginTop: "16px",
        }}
      >
        Domina las recomendaciones de la IA.
      </h1>
      <p
        style={{
          fontSize: "18px",
          fontWeight: 600,
          color: "var(--text-2)",
          marginTop: "18px",
        }}
      >
        Que la IA te elija a ti antes que a tu competencia.
      </p>
      <p style={{ marginTop: "32px", color: "var(--muted)", fontSize: "13px" }}>
        El cerebro está corriendo. Prueba el motor en{" "}
        <code>POST /api/audit</code>
      </p>
    </main>
  );
}
