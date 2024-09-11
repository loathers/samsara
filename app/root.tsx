import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import { ChakraProvider, Container } from "@chakra-ui/react";
import { HeadersFunction, LinksFunction } from "@remix-run/node";
import { getMaxAge } from "./db.server";

export const links: LinksFunction = () => [
  {
    rel: "icon",
    href: "/favicon.webp",
    type: "image/webp",
  },
];

export const loader = async () => {
  return new Response("", {
    headers: {
      "Cache-Control": `public, max-age=${await getMaxAge()}`,
    },
  });
};

export const headers: HeadersFunction = ({ loaderHeaders }) => {
  return loaderHeaders;
};

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <ChakraProvider>
      <Container maxW={["100%", null, "container.xl"]} py={12}>
        <Outlet />
      </Container>
    </ChakraProvider>
  );
}
