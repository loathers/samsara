import { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { parse } from "graphql";
import { gql, GraphQLClient } from "graphql-request";

const client = new GraphQLClient("https://data.loathers.net/graphql");

export async function fetchPaths() {
  try {
    const query: TypedDocumentNode<{
      allPaths: { nodes: { id: number; image: string; name: string }[] };
    }> = parse(gql`
      query GetAllPaths {
        allPaths {
          nodes {
            id
            image
            name
          }
        }
      }
    `);

    const data = await client.request(query);

    return data.allPaths.nodes;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function fetchClasses() {
  try {
    const query: TypedDocumentNode<{
      allClasses: {
        nodes: {
          id: number;
          image: string;
          name: string;
          path: number | null;
        }[];
      };
    }> = parse(gql`
      query GetAllClasses {
        allClasses {
          nodes {
            id
            image
            name
            path
          }
        }
      }
    `);

    const data = await client.request(query);

    return data.allClasses.nodes;
  } catch (error) {
    console.error(error);
    return null;
  }
}
