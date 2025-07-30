import { NextRequest, NextResponse } from 'next/server';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import matter from 'gray-matter';
import { Agent, AgentFilters } from '@/types/agent';

const AGENTS_DIR = join(process.env.HOME || '', '.claude', 'agents');

function parseAgentFile(filename: string, content: string): Agent | null {
  try {
    // Try normal parsing first
    try {
      const { data, content: systemPrompt } = matter(content);
      
      if (data.name && data.description) {
        return {
          id: filename.replace('.md', ''),
          name: data.name,
          description: data.description,
          tools: data.tools ? (Array.isArray(data.tools) ? data.tools : data.tools.split(',').map((tool: string) => tool.trim())) : [],
          color: data.color || 'gray',
          systemPrompt: systemPrompt.trim(),
          filename,
        };
      }
    } catch (e) {
      // Continue to custom parsing
    }

    // Custom parsing for files with problematic descriptions
    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
    if (!frontmatterMatch) return null;

    const [, frontmatter, systemPrompt] = frontmatterMatch;
    
    // Parse frontmatter manually
    const lines = frontmatter.split('\n');
    const data: any = {};
    let currentKey = '';
    let inDescription = false;
    let descriptionLines: string[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      if (inDescription) {
        // Continue collecting description lines until we hit another key:value pair
        if (trimmedLine.includes(':') && !trimmedLine.startsWith('"') && !trimmedLine.startsWith("'")) {
          // This is a new key:value pair, end description collection
          inDescription = false;
          const colonIndex = trimmedLine.indexOf(':');
          const key = trimmedLine.substring(0, colonIndex).trim();
          const value = trimmedLine.substring(colonIndex + 1).trim();
          data[key] = value;
        } else {
          // Continue description
          descriptionLines.push(trimmedLine);
        }
      } else if (trimmedLine.includes(':')) {
        const colonIndex = trimmedLine.indexOf(':');
        const key = trimmedLine.substring(0, colonIndex).trim();
        const value = trimmedLine.substring(colonIndex + 1).trim();
        
        if (key === 'description') {
          currentKey = 'description';
          // Remove quotes if present and start collecting description
          let cleanValue = value.replace(/^["']|["']$/g, '');
          if (cleanValue) {
            descriptionLines.push(cleanValue);
          }
          inDescription = true;
        } else {
          data[key] = value;
        }
      }
    }

    // Join description lines
    if (descriptionLines.length > 0) {
      data.description = descriptionLines.join(' ');
    }

    if (!data.name || !data.description) {
      return null;
    }

    return {
      id: filename.replace('.md', ''),
      name: data.name,
      description: data.description,
      tools: data.tools ? (Array.isArray(data.tools) ? data.tools : data.tools.split(',').map((tool: string) => tool.trim())) : [],
      color: data.color || 'gray',
      systemPrompt: systemPrompt.trim(),
      filename,
    };
  } catch (error) {
    console.error(`Error parsing agent file ${filename}:`, error);
    return null;
  }
}

function filterAgents(agents: Agent[], filters: AgentFilters): Agent[] {
  return agents.filter(agent => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        agent.name.toLowerCase().includes(searchLower) ||
        agent.description.toLowerCase().includes(searchLower) ||
        agent.systemPrompt.toLowerCase().includes(searchLower) ||
        agent.tools.some(tool => tool.toLowerCase().includes(searchLower));
      
      if (!matchesSearch) return false;
    }

    if (filters.color && agent.color !== filters.color) {
      return false;
    }

    if (filters.tools && filters.tools.length > 0) {
      const hasMatchingTool = filters.tools.some(tool => 
        agent.tools.includes(tool)
      );
      if (!hasMatchingTool) return false;
    }

    return true;
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filters: AgentFilters = {
      search: searchParams.get('search') || undefined,
      color: searchParams.get('color') || undefined,
      tools: searchParams.get('tools')?.split(',').filter(Boolean) || undefined,
    };

    let files: string[] = [];
    try {
      files = await readdir(AGENTS_DIR);
    } catch (error) {
      console.error('Error reading agents directory:', error);
      return NextResponse.json({ 
        agents: [], 
        total: 0, 
        filters,
        error: 'Unable to read agents directory' 
      });
    }

    const agentPromises = files
      .filter(file => file.endsWith('.md'))
      .map(async (file) => {
        const filePath = join(AGENTS_DIR, file);
        const content = await readFile(filePath, 'utf-8');
        return parseAgentFile(file, content);
      });

    const agentResults = await Promise.all(agentPromises);
    const agents = agentResults.filter((agent): agent is Agent => agent !== null);

    const filteredAgents = filterAgents(agents, filters);

    return NextResponse.json({
      agents: filteredAgents,
      total: filteredAgents.length,
      filters,
    });
  } catch (error) {
    console.error('Error in agents API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}