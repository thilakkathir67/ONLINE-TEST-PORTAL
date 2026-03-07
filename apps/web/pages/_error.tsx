type ErrorProps = {
  statusCode?: number;
};

export default function ErrorPage({ statusCode }: ErrorProps) {
  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1>Something went wrong</h1>
      <p>{statusCode ? `Error ${statusCode}` : "Unexpected error"}</p>
    </div>
  );
}
