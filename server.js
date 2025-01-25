import express from "express";
import bodyParser from "body-parser";
import { fetchWebsiteContent, cleanHtml, chunkBySentences, storeChunksInPinecone, generateResponseWithONNX } from "./ragmod.js";

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.send(`
        <form action="/process" method="post">
            <label for="url">Enter the website URL:</label>
            <input type="text" id="url" name="url" required>
            <br>
            <label for="query">Enter your query:</label>
            <input type="text" id="query" name="query" required>
            <br>
            <button type="submit">Submit</button>
        </form>
    `);
});

app.post("/process", async (req, res) => {
    const { url, query } = req.body;
    const maxChunkSize = 500; // Max characters per chunk
    const overlapSize = 50; // Overlap between chunks

    try {
        // Fetch, clean, and chunk website content
        const html = await fetchWebsiteContent(url);
        const cleanedText = cleanHtml(html);
        const chunks = chunkBySentences(cleanedText, maxChunkSize, overlapSize);

        // Store chunks in Pinecone
        await storeChunksInPinecone(chunks);

        // Generate response
        const response = await generateResponseWithONNX(query);
        res.send(`<p>ONNX Response: ${response}</p>`);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("An error occurred while processing your request.");
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
