🌾 Multi-Agent Agricultural Decision Support System

Overview
This project presents a conceptual multi-agent agricultural advisory system designed using multi-agent system principles.  
The system coordinates multiple specialized AI agents to provide safe, explainable, and practical agricultural recommendations.
Rather than a single AI agent, this system demonstrates agent collaboration, orchestration, shared memory, reflection, and human oversight. 

The system is intended to be executed in AI Studio or any LLM playground using a single comprehensive system prompt.

#System Objective
To assist farmers by:
- Identifying crop, soil, pest, and environmental issues
- Synthesizing expert-like recommendations
- Managing uncertainty and risk
- Ensuring human approval for high-impact decisions

#Multi-Agent Architecture
The system consists of seven cooperative agents, each with a specialized role:

 1. Supervisor / Orchestrator Agent
- Coordinates the entire system
- Decides agent execution order
- Manages shared memory
- Determines when human input is required
- Controls system termination

 2. Farmer Intake & Context Agent
- Gathers farmer information
- Asks clarifying questions
- Structures input into usable context
- Identifies missing or ambiguous data

 3. Crop & Soil Analysis Agent
- Analyzes crop health conditions
- Identifies nutrient or soil-related issues
- Provides agronomic reasoning
- Avoids absolute claims

 4. Pest, Disease & Risk Detection Agent
- Detects possible pests or diseases
- Assesses likelihood and severity
- Flags high-risk or uncertain cases
- Avoids unsafe or definitive diagnoses

 5. Weather & Environmental Impact Agent
- Evaluates climate and weather conditions
- Identifies drought, flooding, or heat stress risks
- Suggests adaptive farming strategies
- Flags time-sensitive threats

 6. Recommendation Synthesizer & Educator Agent
- Combines insights from all agents
- Produces farmer-friendly recommendations
- Provides step-by-step guidance
- Considers cost-effective and realistic solutions

 7. Reflection & Quality Review Agent
- Critically reviews final recommendations
- Checks for unsafe or hallucinated content
- Ensures disclaimers and uncertainty are present
- Suggests refinements before delivery

#The Use Of Shared Memory
All agents read from and write to a shared memory containing:
- Farmer profile
- Environmental conditions
- Observed symptoms
- Intermediate findings
- Human feedback
- Final recommendations

This enables **coordination and context persistence** across agents.

# Human-in-the-Loop Design
The system explicitly pauses and requests *human approval* when:
- Chemical treatments or pesticides are suggested
- Recommendations involve significant cost or risk
- There is high uncertainty or conflicting diagnoses
- Long-term environmental impact is possible

This ensures **ethical, safe, and responsible AI use**.

---

## The Workflow Summary
1. Supervisor activates Intake Agent
2. Intake Agent gathers farmer context
3. Supervisor dispatches analysis agents
4. Agents update shared memory
5. Synthesizer generates recommendations
6. Reviewer critiques and improves output
7. Supervisor decides to finalize or request human input
8. System terminates upon safe completion

---

## Termination Conditions
The system terminates when:
- A reviewed, safe recommendation is delivered
- The human user requests termination
- Information is insufficient and continuation is declined
- The Supervisor determines the objective is met

---

## Disclaimer
This system provides **advisory information only** and does **not replace certified agricultural professionals**.  
Recommendations may vary depending on local conditions and available resources.

---

## How to Use
1. Open AI Studio (or any LLM playground)
2. Paste the contents of `full_system_prompt.txt` as the system prompt
3. Provide a farming-related query as the user input
4. Observe multi-agent reasoning and coordination

---

## Educational Purpose
This project demonstrates:
- Multi-agent system design
- Task decomposition
- Orchestration and coordination
- Human-in-the-loop AI
- Reflection and quality control mechanisms

It is intended for **academic and learning purposes**.

