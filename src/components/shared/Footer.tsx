export default function Footer() {
  return (
    <footer style={{ padding: "1rem", borderTop: "1px solid #eee", marginTop: "2rem" }}>
      <p>Ameza &copy; {new Date().getFullYear()}</p>
    </footer>
  );
}