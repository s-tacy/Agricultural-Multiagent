
import React from 'react';
import { AgentID, AgentInfo } from './types';

export const AGENTS: Record<AgentID, AgentInfo> = {
  supervisor: {
    id: 'supervisor',
    name: 'Orchestrator',
    role: 'Coordination & Decision Maker',
    color: 'bg-indigo-600',
    icon: '🎯'
  },
  intake: {
    id: 'intake',
    name: 'Context Agent',
    role: 'Information Gatherer',
    color: 'bg-teal-500',
    icon: '📝'
  },
  agronomy: {
    id: 'agronomy',
    name: 'Agronomist',
    role: 'Crop & Soil Specialist',
    color: 'bg-emerald-600',
    icon: '🌱'
  },
  'pest-disease': {
    id: 'pest-disease',
    name: 'Biosecurity Agent',
    role: 'Threat Identification',
    color: 'bg-orange-600',
    icon: '🦠'
  },
  weather: {
    id: 'weather',
    name: 'Climatologist',
    role: 'Environmental Analyst',
    color: 'bg-sky-500',
    icon: '☁️'
  },
  synthesizer: {
    id: 'synthesizer',
    name: 'Solution Architect',
    role: 'Recommendation Integrator',
    color: 'bg-amber-500',
    icon: '🛠️'
  },
  'quality-review': {
    id: 'quality-review',
    name: 'Safety Inspector',
    role: 'Critic & Quality Review',
    color: 'bg-rose-600',
    icon: '🛡️'
  }
};

export const SYSTEM_DISCLAIMER = `**Disclaimer**: This system provides advisory information only. It does not replace professional agronomists. Local conditions may affect outcomes. Consult local experts before implementing high-risk treatments.`;
