import { GoogleGenAI, Type } from "@google/genai";
import { TermInput, PuzzleData } from "../types";

export const generatePuzzleData = async (
  themeInput: string,
  termsInput: TermInput[]
): Promise<PuzzleData> => {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    throw new Error("Geen API Key gevonden. Controleer process.env.API_KEY.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Construct a prompt that includes user provided data
  const termsDescription = termsInput
    .map((t, index) => {
      const clues = t.userClues.filter(c => c.trim() !== "").join(", ");
      return `Begrip ${index + 1}: "${t.term}"${clues ? ` (Gebruikers suggesties: ${clues})` : ""}`;
    })
    .join("\n");

  const systemInstruction = `Je bent de redacteur van de "Puzzelronde" van het programma "De Slimste Mens". 
Je taak is om een puzzel te genereren in strikt JSON formaat.`;

  const userPrompt = `
    Maak een puzzelronde op basis van de volgende input.
    Thema: ${themeInput || "Kies een passend thema bij de begrippen"}
    
    De input bevat 4 begrippen. Voor elk begrip heb ik PRECIES 3 korte, pakkende trefwoorden/omschrijvingen nodig.
    
    Input Begrippen:
    ${termsDescription}

    Instructies:
    1. Gebruik de opgegeven begrippen.
    2. Als er gebruikerssuggesties zijn, gebruik deze of verbeter ze.
    3. Als er geen suggesties zijn, bedenk zelf slimme associaties (1-3 woorden).
    4. Het totaal moet bestaan uit 4 begrippen met elk 3 omschrijvingen.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            theme: { type: Type.STRING },
            groups: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  clues: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ["term", "clues"],
              }
            }
          },
          required: ["theme", "groups"],
        }
      }
    });

    const content = response.text;

    if (!content) {
      throw new Error("Geen antwoord ontvangen van de AI.");
    }
    
    let puzzleData;
    try {
        puzzleData = JSON.parse(content);
    } catch (e) {
        // Fallback cleanup if the model wraps code in markdown backticks
        const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
        puzzleData = JSON.parse(cleanJson);
    }
    
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
    throw error;
  }
};