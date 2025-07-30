'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Agent, AgentFilters } from '@/types/agent';

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

export default function Home() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AgentFilters>({});

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [agents, filters]);

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents');
      if (!response.ok) {
        throw new Error('Failed to fetch agents');
      }
      const data = await response.json();
      setAgents(data.agents);
      setFilteredAgents(data.agents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = agents;

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(agent =>
        agent.name.toLowerCase().includes(searchLower) ||
        agent.description.toLowerCase().includes(searchLower) ||
        agent.systemPrompt.toLowerCase().includes(searchLower) ||
        agent.tools.some(tool => tool.toLowerCase().includes(searchLower))
      );
    }

    if (filters.color) {
      filtered = filtered.filter(agent => agent.color === filters.color);
    }

    setFilteredAgents(filtered);
  };

  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value || undefined }));
  };

  const handleColorFilter = (color: string) => {
    setFilters(prev => ({ 
      ...prev, 
      color: prev.color === color ? undefined : color 
    }));
  };

  const getAllColors = () => {
    const colors = new Set(agents.map(agent => agent.color));
    return Array.from(colors);
  };

  const getAllTools = () => {
    const tools = new Set(agents.flatMap(agent => agent.tools));
    return Array.from(tools).sort();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading agents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Error</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Claude Code Sub-Agents Store
          </h1>
          <p className="text-lg text-gray-600">
            Browse and explore your Claude Code sub-agents
          </p>
        </div>

        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search agents by name, description, tools..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.search || ''}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-sm font-medium text-gray-700 mr-2">Colors:</span>
            {getAllColors().map(color => (
              <button
                key={color}
                onClick={() => handleColorFilter(color)}
                className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                  filters.color === color 
                    ? colorMap[color as keyof typeof colorMap] + ' ring-2 ring-offset-2 ring-' + color
                    : colorMap[color as keyof typeof colorMap] + ' opacity-60 hover:opacity-100'
                }`}
              >
                {color}
              </button>
            ))}
          </div>

          <div className="text-sm text-gray-600">
            Showing {filteredAgents.length} of {agents.length} agents
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map(agent => (
            <div
              key={agent.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 cursor-pointer"
              onClick={() => router.push(`/agents/${agent.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{agent.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                  colorMap[agent.color as keyof typeof colorMap] || colorMap.gray
                }`}>
                  {agent.color}
                </span>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {agent.description}
              </p>

              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Tools:</h4>
                <div className="flex flex-wrap gap-1">
                  {agent.tools.slice(0, 6).map(tool => (
                    <span
                      key={tool}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                    >
                      {tool}
                    </span>
                  ))}
                  {agent.tools.length > 6 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">
                      +{agent.tools.length - 6} more
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center text-blue-600 text-sm font-medium">
                View Details
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>

        {filteredAgents.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">No agents found</div>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}