import './globals.css'

export const metadata = {
  title: 'Sesnap',
  description: 'Социальная сеть нового поколения',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}
