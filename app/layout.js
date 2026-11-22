import "./globals.css";

export const metadata = {
  title: "Folders",
  description: "Each email is a folder. Inside it: two photos, the address, and the India time.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
