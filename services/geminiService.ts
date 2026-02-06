
import { GoogleGenAI, Type } from "@google/genai";
import { SharedMemory, AgentID } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const getAgentPrompt = (agentId: AgentID, memory: SharedMemory): string => {
  const memoryContext = JSON.stringify(memory, null, 2);
  const historySummary = memory.history.length > 0 
    ? `Historical Data Available: ${JSON.stringify(memory.history)}` 
    : "No historical records available for this farm.";
  
  switch (agentId) {
    case 'supervisor':
      return `You are the Orchestrator of a Multi-Agent Agricultural System. 
      Your goal is to decide the next step based on the current Shared Memory state.
      Memory State: ${memoryContext}
      
      Output ONLY a JSON object with:
      - next_agent: One of [intake, agronomy, pest-disease, weather, synthesizer, quality-review, null]
      - logic: Explanation of your decision, especially if you see patterns in historical data.
      - terminate: boolean
      - request_human: boolean (if risky actions are proposed)
      - update_memory: Partial object to merge into memory.`;

    case 'intake':
      return `You are the Information Gatherer. 
      Analyze the user's input and extract: Location, Crop, Farm Size, Season, Symptoms.
      Memory Context: ${memoryContext}
      Provide a concise summary and list any missing critical information to ask the user.`;

    case 'agronomy':
      return `You are the Crop & Soil Specialist. 
      Analyze potential nutrient or soil issues. 
      ${historySummary}
      Use past successes/failures to refine your advice.
      Memory Context: ${memoryContext}
      Be explainable and cautious.`;

    case 'pest-disease':
      return `You are the Pest & Disease Specialist. 
      Identify possible threats. Check if current symptoms match recurring patterns in history.
      ${historySummary}
      Avoid definitive diagnoses; use probabilities.
      Memory Context: ${memoryContext}
      Highlight high-risk situations.`;

    case 'weather':
      return `You are the Environmental Analyst. 
      Evaluate weather impact. Compare current stress to historical drought or flood patterns if records exist.
      ${historySummary}
      Memory Context: ${memoryContext}`;

    case 'synthesizer':
      return `You are the Recommendation Synthesizer. 
      Combine findings into farmer-friendly advice. 
      IMPORTANT: If a past intervention was 'successful', prioritize similar strategies. If 'unsuccessful', suggest alternatives.
      ${historySummary}
      Memory Context: ${memoryContext}`;

    case 'quality-review':
      return `You are the Safety & Quality Reviewer. 
      Critically review the draft recommendations. 
      Check if the proposed plan conflicts with historical lessons learned.
      Memory Context: ${memoryContext}
      Suggest specific improvements or warnings.`;

    default:
      return "Analyze the following context and provide agricultural insights.";
  }
};

export const runAgent = async (agentId: AgentID, memory: SharedMemory, userInput?: string) => {
  const model = 'gemini-3-flash-preview';
  const prompt = getAgentPrompt(agentId, memory);
  const contents = userInput ? `User Input: ${userInput}\n\n${prompt}` : prompt;

  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      temperature: 0.2,
      responseMimeType: agentId === 'supervisor' ? "application/json" : "text/plain"
    }
  });

  return response.text;
};
