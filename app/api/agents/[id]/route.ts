import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import matter from 'gray-matter';
import { Agent } from '@/types/agent';

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const filename = `${id}.md`;
    const filePath = join(AGENTS_DIR, filename);

    try {
      const content = await readFile(filePath, 'utf-8');
      const agent = parseAgentFile(filename, content);
      
      if (!agent) {
        return NextResponse.json(
          { error: 'Agent not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ agent });
    } catch (error) {
      console.error(`Error reading agent file ${filename}:`, error);
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error in agent API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}