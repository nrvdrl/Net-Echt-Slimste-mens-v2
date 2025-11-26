import { GoogleGenAI, Type } from "@google/genai";
import { TermInput, PuzzleData } from "../types";

export const generatePuzzleData = async (
  themeInput: string,
  termsInput: TermInput[]
): Promise<PuzzleData> => {
  // Initialize the client with the API key from process.env
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Construct a prompt that includes user provided data
  const termsDescription = termsInput
    .map((t, index) => {
      const clues = t.userClues.filter(c => c.trim() !== "").join(", ");
      return `Begrip ${index + 1}: "${t.term}"${clues ? ` (Gebruikers suggesties voor omschrijvingen: ${clues})` : ""}`;
    })
    .join("\n");

  const userPrompt = `
    Maak een puzzelronde op basis van de volgende input.
    Thema: ${themeInput || "Kies een passend thema bij de begrippen"}
    
    De input bevat 4 begrippen. Voor elk begrip heb ik PRECIES 3 korte, pakkende trefwoorden/omschrijvingen nodig.
    
    Instructies:
    1. Gebruik de opgegeven begrippen.
    2. Als er gebruikerssuggesties zijn voor omschrijvingen, gebruik deze of verbeter ze zodat ze kort en krachtig zijn.
    3. Als er geen suggesties zijn, bedenk zelf slimme, creatieve en korte associaties (1-3 woorden per omschrijving).
    4. Het totaal moet bestaan uit 4 begrippen met elk 3 omschrijvingen.
    5. De taal moet Nederlands zijn.
    
    Input Begrippen:
    ${termsDescription}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: 'Je bent de redacteur van de "Puzzelronde" van het programma "De Slimste Mens". Je taak is om een puzzel te genereren.',
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            theme: { type: Type.STRING, description: "Het overkoepelende thema" },
            groups: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING, description: "Het antwoord/begrip" },
                  clues: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Precies 3 korte omschrijvingen"
                  }
                },
                required: ["term", "clues"]
              },
              description: "Precies 4 items"
            }
          },
          required: ["theme", "groups"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response received from Gemini.");
    }
    
    const puzzleData = JSON.parse(text);
    
    // Transform API response to internal format with IDs
    return {
      theme: puzzleData.theme,
      groups: puzzleData.groups.map((g: any, index: number) => ({
        id: `group-${index}`,
        term: g.term,
        clues: g.clues.slice(0, 3) // Ensure max 3
      }))
    };

  } catch (error) {
    console.error("API Error:", error);
    throw new Error("Kon de puzzel niet genereren. Controleer je API key.");
  }
};