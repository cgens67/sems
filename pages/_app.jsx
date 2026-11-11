import "../styles/globals.css";
import Head from "next/head";
import Sidebar from "@/components/Sidebar";

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Nunito:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <Sidebar />
      <Component {...pageProps} />
    </>
  );
}