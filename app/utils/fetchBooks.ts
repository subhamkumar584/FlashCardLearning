export async function fetchBooks(query: string) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  const response = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
      query
    )}&key=${apiKey}&maxResults=1`
  );
  const data = await response.json();
  return data.items?.[0];
}
