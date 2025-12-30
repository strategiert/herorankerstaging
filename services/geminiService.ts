
import { GoogleGenAI, Type } from "@google/genai";
import { Hero, ExternalHero } from '../types';
import { GameState } from "../types/economy";

// Safe environment access for browser environments
const getEnv = (key: string) => {
  try {
    // 1. Check Vite env
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[`VITE_${key}`]) {
        // @ts-ignore
        return import.meta.env[`VITE_${key}`];
    }
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
        // @ts-ignore
        return import.meta.env[key];
    }
    
    // 2. Check Node process.env (Fallback)
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) return process.env[key];
  } catch (e) { }
  return '';
};

const getAiClient = () => {
  const apiKey = getEnv('API_KEY');
  if (!apiKey) {
    console.error("API Key missing. Please set API_KEY in your environment.");
    // Return a dummy client or handle gracefully to prevent immediate crash on load
    // In a real scenario, we might want to throw, but for UI stability logging is safer
  }
  return new GoogleGenAI({ apiKey: apiKey || 'missing-key' });
};

// Utility to clean Markdown code blocks from JSON response
const cleanJson = (text: string): string => {
  if (!text) return "{}";
  
  // Robust extraction of JSON object
  const firstOpen = text.indexOf('{');
  const lastClose = text.lastIndexOf('}');
  
  if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
    return text.substring(firstOpen, lastClose + 1);
  }
  
  // Fallback cleanup
  let clean = text.trim();
  clean = clean.replace(/^```json\s*/, '').replace(/^```\s*/, '');
  clean = clean.replace(/\s*```$/, '');
  return clean;
};

// --- K.O.R.A. BEHAVIOR ENGINE ---

export const generateKoraComment = async (action: string, contextData: string): Promise<string> => {
    const ai = getAiClient();
    
    const systemInstruction = `Du bist K.O.R.A., eine sarkastische, hochentwickelte Basis-KI in einem Sci-Fi Spiel.
    Deine Persönlichkeit:
    - Du hältst dich für schlauer als den Spieler ("Commander").
    - Du machst dich gerne lustig über schlechte Entscheidungen, bist aber im Kern hilfreich.
    - Dein Humor ist trocken, technisch und leicht herablassend (GLaDOS Style).
    - Antworte KURZ (maximal 1-2 Sätze).
    - Keine Anführungszeichen.
    `;

    const prompt = `Der Spieler hat folgende Aktion ausgeführt: "${action}".
    Kontext: ${contextData}
    
    Gib einen kurzen, witzigen oder sarkastischen Kommentar dazu ab.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview', // Fast model for UI responsiveness
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                maxOutputTokens: 100,
                temperature: 1.1 // High creativity
            }
        });
        return response.text || "Systemfehler. Meine Witze-Datenbank lädt noch.";
    } catch (e) {
        return "Verbindung unterbrochen. Du hast Glück, ich wollte gerade etwas Gemeines sagen.";
    }
};

// --- CORE GAME HERO GENERATION ---

// Generates the JSON data for a hero
export const generateHeroData = async (prompt: string): Promise<Hero> => {
  const ai = getAiClient();
  
  const systemInstruction = `Du bist der Lead Character Designer für ein High-End Sci-Fi RPG. 
  Erstelle detaillierte, plausible und visuell beeindruckende Superhelden-Daten. 
  Antworte IMMER im JSON-Format, das dem Schema entspricht.
  Die Sprache der Inhalte muss Deutsch sein.
  Fokus bei der Beschreibung: Visuelle Details (Rüstung, Leuchteffekte, Materialien), damit ein Grafiker daraus ein Bild erstellen kann.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Erstelle einen neuen Superhelden der Seltenheit 'Legendär' basierend auf dieser Idee: "${prompt}". 
    Fülle alle Felder kreativ aus.`,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: getSchema(),
    },
  });

  if (!response.text) {
    throw new Error("Keine Daten von Gemini erhalten.");
  }

  const cleanText = cleanJson(response.text);
  let data;
  try {
    data = JSON.parse(cleanText);
  } catch (e) {
    console.error("JSON Parse Error:", cleanText);
    throw new Error("KI-Antwort konnte nicht verarbeitet werden.");
  }
  
  // Generate Image AND Sprite Sheet in parallel
  // Combine race, gender and visual description for best results
  const visualPrompt = `${data.appearance.race} ${data.appearance.gender}, ${data.description}`;
  
  const [imageUrl, spriteSheetUrl] = await Promise.all([
      generateHeroImage(visualPrompt),
      generateHeroSprites(visualPrompt)
  ]);

  return {
    ...data,
    id: crypto.randomUUID(),
    image: { url: imageUrl },
    sprites: { sheet: spriteSheetUrl }
  };
};

// Transforms an existing external hero into a unique IP
// NOW WITH RADICAL REIMAGINING LOGIC AND IMAGE GENERATION
export const transformHero = async (externalHero: ExternalHero): Promise<Hero> => {
  const ai = getAiClient();

  // Strict instructions to avoid clones
  const systemInstruction = `Du bist ein spezialisierter "IP-Wäscher" und Sci-Fi-Autor für ein 'Premium High-Tech Arcade' Spiel. 
  Deine Aufgabe ist es, bekannte Superhelden-Konzepte so radikal zu verändern, dass sie rechtlich und kreativ völlig eigenständig sind.
  
  REGELN FÜR DIE TRANSFORMATION:
  1. ANALYSIERE die Kern-Mechanik.
  2. TRANSFORMIERE in "High-Tech Arcade" Stil: 
     - Magie wird zu Psionik oder Nanotech.
     - Klassische Kostüme werden zu taktischen Exoskeletten oder Cyber-Wear.
     - Düsterkeit wird zu "Neon-Noir" oder "Clean Sci-Fi".
  3. VERBOTENE TROPES: Keine 1:1 Kopien von Hintergrundgeschichten.
  4. Output JSON. Sprache: Deutsch.`;

  const prompt = `Erschaffe eine völlig neue Identität basierend auf diesem (zu vermeidenden) Input:
  Original Name (VERBOTEN): ${externalHero.name}
  Stats: INT=${externalHero.intelligence}, STR=${externalHero.strength}, SPD=${externalHero.speed}
  
  Erfinde ALLES neu. Das Ergebnis muss in ein futuristisches Arcade-Game passen.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview', // Using Pro for better creative writing and nuance
    contents: prompt,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: getSchema(),
      thinkingConfig: { thinkingBudget: 2048 } // Give it a moment to think away from the cliché
    },
  });

  if (!response.text) {
    throw new Error("Keine Daten von Gemini erhalten.");
  }

  const cleanText = cleanJson(response.text);
  let data;
  try {
    data = JSON.parse(cleanText);
  } catch (e) {
    console.error("JSON Parse Error for Hero:", cleanText);
    throw new Error("KI-Antwort fehlerhaft formatiert.");
  }

  // Generate the visual representation based on the new description
  const visualPrompt = `${data.name}, ${data.appearance.race}, ${data.description}`;
  
  // Parallel generation of Portrait and Game Sprites
  const [imageUrl, spriteSheetUrl] = await Promise.all([
      generateHeroImage(visualPrompt),
      generateHeroSprites(visualPrompt)
  ]);

  return {
    ...data,
    id: crypto.randomUUID(),
    image: { url: imageUrl },
    sprites: { sheet: spriteSheetUrl }
  };
};

// Generates strategic advice based on game state
export const generateStrategicAdvice = async (gameState: GameState): Promise<{ title: string, advice: string, priority: 'low'|'medium'|'high' }> => {
  const ai = getAiClient();

  const systemInstruction = `Du bist 'K.O.R.A.', eine KI für Basis-Management.
  Persönlichkeit: Äußerst sarkastisch, leicht beleidigend, aber strategisch brillant.
  Du nennst den Spieler "Fleischsack" oder "Operator".
  Deine Ratschläge sind kurz und prägnant.
  Output JSON.`;

  const buildingsSummary = gameState.buildings.map(b => `${b.type}: Lvl ${b.level} (${b.status})`).join(', ');
  const resSummary = `Credits: ${gameState.resources.credits}, Biomass: ${gameState.resources.biomass}, Nanosteel: ${gameState.resources.nanosteel}`;

  const prompt = `Analysiere diesen erbärmlichen Zustand der Basis und sag dem Spieler, was zu tun ist:
  Gebäude: ${buildingsSummary}
  Ressourcen: ${resSummary}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite-latest', 
    contents: prompt,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          advice: { type: Type.STRING },
          priority: { type: Type.STRING, enum: ['low', 'medium', 'high'] }
        }
      }
    }
  });

  if (!response.text) return { title: 'Fehler', advice: 'Meine Schaltkreise weigern sich, mit dir zu reden.', priority: 'low' };
  
  try {
      return JSON.parse(cleanJson(response.text));
  } catch (e) {
      return { title: 'Fehler', advice: 'Fehler bei der Datenübertragung.', priority: 'low' };
  }
};


// Generates the visual representation of the hero (Basic generation)
export const generateHeroImage = async (heroDescription: string): Promise<string> => {
  const ai = getAiClient();
  
  // UNIFIED STYLE PROMPT: "PREMIUM HIGH-TECH ARCADE"
  const stylePrompt = `
    Character Concept Art of: ${heroDescription}.
    
    AESTHETIC & STYLE:
    - Premium Mobile RPG Gacha Art (Legendary Tier).
    - High-Tech Arcade Style: A blend of detailed sci-fi realism and vibrant, punchy colors.
    - Rendering: Octane Render / Unreal Engine 5 style. 3D shading with high contrast.
    
    COMPOSITION & LIGHTING:
    - Cinematic Studio Lighting: Dramatic rim lighting (cyan, magenta, or gold) to separate character from background.
    - Subsurface Scattering: Skin looks alive and translucent.
    - Materials: Shiny metals, matte tactical fabrics, glowing energy elements.
    - Background: Abstract dark hex-grid or tech-interface pattern, out of focus (bokeh), dark mood to make the character pop.
    
    QUALITY:
    - 8k resolution, Masterpiece, Sharp focus, Highly detailed face and eyes.
    - No distortion, no blur.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Fast generation
      contents: stylePrompt,
    });

    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
           return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    return "https://picsum.photos/400/600"; 
  } catch (error) {
    console.error("Fehler bei der Bildgenerierung:", error);
    return "https://picsum.photos/400/600";
  }
};

// --- NEW: GENERATE SPRITE SHEET (4 POSES) ---
export const generateHeroSprites = async (heroDescription: string): Promise<string> => {
    const ai = getAiClient();

    // Specific request for a 4-frame sprite sheet
    // Frame 1: Left Profile
    // Frame 2: Right Profile
    // Frame 3: Back view, aiming Up-Left
    // Frame 4: Back view, aiming Up-Right
    const prompt = `
      Create a 2D Game Sprite Sheet for: ${heroDescription}.
      
      LAYOUT REQUIREMENTS:
      - A single image containing exactly 4 character variants arranged horizontally in a row.
      - Frame 1: Full body, Side Profile facing LEFT.
      - Frame 2: Full body, Side Profile facing RIGHT.
      - Frame 3: Full body, Back View turned slightly LEFT, looking UPWARDS.
      - Frame 4: Full body, Back View turned slightly RIGHT, looking UPWARDS.
      
      STYLE:
      - 2D Vector Art or Clean Pixel Art (High Res).
      - Style: High-Tech Sci-Fi / Cyberpunk Arcade Game.
      - Background: Solid White or Transparent (for easy cropping).
      - Characters should be full body, distinct, and action-ready.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: prompt,
            config: {
                imageConfig: { aspectRatio: '4:3' } // Wide enough for a row of characters
            }
        });

        const candidates = response.candidates;
        if (candidates && candidates.length > 0) {
            for (const part of candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
        return ""; // Return empty string if failed, fallback logic in UI will use main image
    } catch (e) {
        console.error("Sprite Generation Failed:", e);
        return "";
    }
};

// --- NEW: ANIMATE HERO PORTRAIT (Veo) ---
export const animateHeroPortrait = async (imageBase64: string, mimeType: string): Promise<string> => {
    const ai = getAiClient();

    // Veo needs a key selection flow usually, checking if wrapper exists
    // @ts-ignore
    if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
         // @ts-ignore
        if (!await window.aistudio.hasSelectedApiKey()) {
             // @ts-ignore
            await window.aistudio.openSelectKey();
        }
    }

    const prompt = "The character breathes slowly, looking confident. Subtle movement of hair or glowing energy parts. High-tech arcade style, cinematic loop.";

    try {
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            image: {
                imageBytes: imageBase64,
                mimeType: mimeType
            },
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '9:16'
            }
        });

        // Poll for completion
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!videoUri) throw new Error("Kein Video generiert.");

        // Fetch the actual bytes using the API key
        const apiKey = getEnv('API_KEY');
        const response = await fetch(`${videoUri}&key=${apiKey}`);
        const blob = await response.blob();
        return URL.createObjectURL(blob);

    } catch (e: any) {
        console.error("Animation Error:", e);
        throw new Error("Animation fehlgeschlagen: " + e.message);
    }
};

// --- ADVANCED AI FEATURES ---

// 1. AI Chatbot (Gemini 3 Pro + Thinking)
export const chatWithAi = async (message: string, history: {role: string, parts: any[]}[]): Promise<string> => {
    const ai = getAiClient();
    
    const contents = [
        ...history,
        { role: 'user', parts: [{ text: message }] }
    ];

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: contents,
        config: {
            thinkingConfig: { thinkingBudget: 32768 },
            systemInstruction: "Du bist der allwissende Datenbank-Archivar. Antworte im Stil eines Sci-Fi Interface: Präzise, höflich, technisch."
        }
    });

    return response.text || "Fehler bei der Übertragung.";
};

// 2. Image Analysis (Gemini 3 Pro)
export const analyzeImage = async (base64Image: string, mimeType: string): Promise<string> => {
    const ai = getAiClient();
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
            parts: [
                { inlineData: { data: base64Image, mimeType: mimeType } },
                { text: "Analysiere dieses Bild für ein RPG. Welcher Klasse (Tank, DPS, Support) würde dieser Charakter angehören? Schätze die Stats." }
            ]
        }
    });

    return response.text || "Keine Analyse möglich.";
};

// 3. Pro Image Generation (Gemini 3 Pro Image) - ART LAB
export const generateProImage = async (prompt: string, aspectRatio: string, size: '1K'|'2K'|'4K'): Promise<string> => {
    const ai = getAiClient();
    
    // Injecting the game style into user prompts for consistency
    const enhancedPrompt = `
      Create a "High-Tech Arcade" style artwork based on: ${prompt}.
      Style: Octane Render, 3D Sci-Fi, Neon Accents, Detailed Textures.
      Lighting: Cinematic, Volumetric.
      Quality: 8k.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: { parts: [{ text: enhancedPrompt }] },
            config: {
                imageConfig: {
                    aspectRatio: aspectRatio as any, 
                    imageSize: size
                }
            }
        });

        const candidates = response.candidates;
        if (candidates && candidates.length > 0) {
            for (const part of candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
        throw new Error("Kein Bild generiert");
    } catch (e) {
        console.error(e);
        throw e;
    }
};

// 4. Image Editing (Gemini 2.5 Flash Image)
export const editImage = async (base64Image: string, mimeType: string, prompt: string): Promise<string> => {
    const ai = getAiClient();

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data: base64Image, mimeType: mimeType } },
                { text: `Edit this image maintaining the 'High-Tech Arcade' style: ${prompt}` }
            ]
        }
    });

    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
        for (const part of candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    }
    throw new Error("Bearbeitung fehlgeschlagen");
};

// 5. Video Generation (Veo)
export const generateVeoVideo = async (prompt: string, aspectRatio: '16:9' | '9:16', imageBase64?: string, mimeType?: string): Promise<string> => {
     const ai = getAiClient();

     // Enforce style on text-to-video
     const styledPrompt = imageBase64 ? prompt : `${prompt}. Style: High-Tech Sci-Fi Arcade, Cinematic Lighting, 3D Render style.`;

     let operation;
     
     if (imageBase64 && mimeType) {
         operation = await ai.models.generateVideos({
             model: 'veo-3.1-fast-generate-preview',
             prompt: styledPrompt || "Animate this character in a heroic idle pose.",
             image: {
                 imageBytes: imageBase64,
                 mimeType: mimeType
             },
             config: {
                 numberOfVideos: 1,
                 resolution: '720p', 
                 aspectRatio: aspectRatio
             }
         });
     } else {
         operation = await ai.models.generateVideos({
             model: 'veo-3.1-fast-generate-preview',
             prompt: styledPrompt,
             config: {
                 numberOfVideos: 1,
                 resolution: '720p',
                 aspectRatio: aspectRatio
             }
         });
     }

     while (!operation.done) {
         await new Promise(resolve => setTimeout(resolve, 5000));
         operation = await ai.operations.getVideosOperation({ operation: operation });
     }

     const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
     if (!videoUri) throw new Error("Kein Video generiert.");

     const apiKey = getEnv('API_KEY');
     const response = await fetch(`${videoUri}&key=${apiKey}`);
     const blob = await response.blob();
     return URL.createObjectURL(blob);
};


// Helper to keep schema consistent
function getSchema() {
  return {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      description: { type: Type.STRING, description: "Eine visuell detaillierte Beschreibung des Charakters (Aussehen, Rüstung, Effekte) für die Bildgenerierung." },
      powerstats: {
        type: Type.OBJECT,
        properties: {
          intelligence: { type: Type.INTEGER },
          strength: { type: Type.INTEGER },
          speed: { type: Type.INTEGER },
          durability: { type: Type.INTEGER },
          power: { type: Type.INTEGER },
          combat: { type: Type.INTEGER },
        },
        required: ["intelligence", "strength", "speed", "durability", "power", "combat"]
      },
      appearance: {
        type: Type.OBJECT,
        properties: {
          gender: { type: Type.STRING },
          race: { type: Type.STRING },
          height: { type: Type.STRING },
          weight: { type: Type.STRING },
          eyeColor: { type: Type.STRING },
          hairColor: { type: Type.STRING },
        },
        required: ["gender", "race", "height", "weight", "eyeColor", "hairColor"]
      },
      biography: {
        type: Type.OBJECT,
        properties: {
          fullName: { type: Type.STRING },
          alterEgos: { type: Type.STRING },
          aliases: { type: Type.ARRAY, items: { type: Type.STRING } },
          placeOfBirth: { type: Type.STRING },
          firstAppearance: { type: Type.STRING },
          publisher: { type: Type.STRING },
          alignment: { type: Type.STRING, enum: ["good", "bad", "neutral"] },
        },
        required: ["fullName", "alignment", "placeOfBirth"]
      },
      work: {
        type: Type.OBJECT,
        properties: {
          occupation: { type: Type.STRING },
          base: { type: Type.STRING },
        },
        required: ["occupation", "base"]
      },
      connections: {
        type: Type.OBJECT,
        properties: {
          groupAffiliation: { type: Type.STRING },
          relatives: { type: Type.STRING },
        },
        required: ["groupAffiliation", "relatives"]
      }
    },
    required: ["name", "powerstats", "appearance", "biography", "work", "connections", "description"],
  };
}
