import type { AppProps } from 'next/app'
import Head from 'next/head'
import { Geist } from 'next/font/google'
import { Providers } from '@/components/shared/Providers'
import '@/app/globals.css'
import '@/components/mock/mock.css'

const geist = Geist({ subsets: ['latin'] })

export default function App({ Component, pageProps }: AppProps) {
  return <div className={`dark min-h-screen bg-background text-foreground ${geist.className}`}>
    <Head>
      <title>KodeHub · Your classroom, connected</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#080e20" />
    </Head>
    <style jsx global>{`body { font-family: ${geist.style.fontFamily}; }`}</style>
    <Providers initialLocale="en"><Component {...pageProps} /></Providers>
  </div>
}
