'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Agent } from '@/types/agent';

const colorMap = {
  red: 'bg-red-100 text-red-800 border-red-300',
  blue: 'bg-blue-100 text-blue-800 border-blue-300',
  green: 'bg-green-100 text-green-800 border-green-300',
  yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  purple: 'bg-purple-100 text-purple-800 border-purple-300',
  orange: 'bg-orange-100 text-orange-800 border-orange-300',
  pink: 'bg-pink-100 text-pink-800 border-pink-300',
  cyan: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  gray: 'bg-gray-100 text-gray-800 border-gray-300',
};

interface AgentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function AgentDetailPage({ params }: AgentDetailPageProps) {
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agentId, setAgentId] = useState<string>('');

  useEffect(() => {
    const getId = async () => {
      const { id } = await params;
      setAgentId(id);
    };
    getId();
  }, [params]);

  useEffect(() => {
    if (agentId) {
      fetchAgent();
    }
  }, [agentId]);

  const fetchAgent = async () => {
    try {
      const response = await fetch(`/api/agents/${agentId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('Agent not found');
        } else {
          throw new Error('Failed to fetch agent');
        }
        return;
      }
      const data = await response.json();
      setAgent(data.agent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading agent details...</p>
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-lg font-semibold mb-2">Error</div>
          <p className="text-gray-600 mb-4">{error || 'Agent not found'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Agents
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/')}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Agents
          </button>
        </div>

        {/* Agent Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-3xl font-bold text-gray-900">{agent.name}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                  colorMap[agent.color as keyof typeof colorMap] || colorMap.gray
                }`}>
                  {agent.color}
                </span>
              </div>
              <div className="text-lg text-gray-600 mb-4 leading-relaxed whitespace-pre-wrap">{agent.description.replace(/\\n/g, '\n')}</div>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                  <span className="text-gray-500">ID: {agent.id}</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-gray-500">File: {agent.filename}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tools Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Available Tools</h2>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {agent.tools.length} tool{agent.tools.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {agent.tools.map(tool => (
                <span
                  key={tool}
                  className="px-3 py-2 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 border border-blue-200 rounded-lg text-sm font-medium hover:from-blue-100 hover:to-blue-200 transition-all duration-200"
                >
                  {tool}
                </span>
              ))}
              {agent.tools.length === 0 && (
                <div className="flex items-center gap-2 text-gray-500 italic">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  No tools specified
                </div>
              )}
            </div>
          </div>

          {/* System Prompt Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">System Prompt</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {agent.systemPrompt.length} characters
                </span>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {agent.systemPrompt.split('\n').length} lines
                </span>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-6 shadow-inner">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed overflow-x-auto">
                  {agent.systemPrompt}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Information Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Agent Statistics */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Agent Statistics
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Total Tools:</span>
                <span className="font-medium text-gray-900">{agent.tools.length}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Color Category:</span>
                <span className="font-medium text-gray-900 capitalize">{agent.color}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Prompt Length:</span>
                <span className="font-medium text-gray-900">{agent.systemPrompt.length} chars</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Prompt Lines:</span>
                <span className="font-medium text-gray-900">{agent.systemPrompt.split('\n').length}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(agent.systemPrompt);
                }}
                className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy System Prompt
              </button>
              <button
                onClick={() => {
                  const agentData = {
                    name: agent.name,
                    description: agent.description,
                    tools: agent.tools,
                    color: agent.color,
                    systemPrompt: agent.systemPrompt
                  };
                  navigator.clipboard.writeText(JSON.stringify(agentData, null, 2));
                }}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Agent Data (JSON)
              </button>
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Additional Info
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Created Date</div>
                <div className="text-sm font-medium text-gray-900">
                  {new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Agent Type</div>
                <div className="text-sm font-medium text-gray-900">Claude Sub-Agent</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Status</div>
                <div className="text-sm font-medium text-green-600">Active</div>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Tips */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Usage Tips
          </h3>
          <ul className="text-sm text-gray-700 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              Use the "Copy System Prompt" button to quickly copy the agent's instructions
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              The "Copy Agent Data (JSON)" button exports all agent information in a structured format
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              Agent files are stored in <code className="bg-gray-200 px-1 rounded">~/.claude/agents/</code> directory
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}