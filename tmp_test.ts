
import { GoogleGenAI } from "@google/genai";
console.log("GoogleGenAI:", GoogleGenAI);
const ai = new GoogleGenAI({ apiKey: "test" });
console.log("ai properties:", Object.keys(ai));
if (ai.models) console.log("ai.models properties:", Object.keys(ai.models));
