"use client";

import { useQuery } from "@tanstack/react-query";
import { gql, request } from "graphql-request";

// ---------- Types ----------
type GraphResponse = {
  approvalForAlls: {
    id: string;
    account: string;
    operator: string;
    approved: boolean;
  }[];
  badgeMinteds: {
    id: string;
    to: string;
    tokenId: string;
    uri: string;
  }[];
};

// ---------- GraphQL ----------
const query = gql`
  {
    approvalForAlls(first: 5) {
      id
      account
      operator
      approved
    }
    badgeMinteds(first: 5) {
      id
      to
      tokenId
      uri
    }
  }
`;

const url =
  "https://api.studio.thegraph.com/query/117940/code-block/version/latest";

// ---------- Fetcher ----------
async function fetchGraphData(): Promise<GraphResponse> {
  return request(url, query);
}

// ---------- Component ----------
export default function Data() {
  const { data, isLoading, isError } = useQuery<GraphResponse>({
    queryKey: ["graph-data"],
    queryFn: fetchGraphData,
  });

  if (isLoading) return <p className="text-gray-400">Loading...</p>;
  if (isError) return <p className="text-red-500">Error fetching data</p>;

  return (
    <div className="p-4 bg-gray-900 text-gray-100 rounded-lg">
      <h2 className="text-lg font-semibold mb-2">Graph Data</h2>
      <pre className="text-sm">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
