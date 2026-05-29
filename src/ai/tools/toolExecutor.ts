import {
  readWorkspaceFile,
  writeWorkspaceFile,
  createWorkspaceFolder,
  deleteWorkspacePath
} from '@/services/fileSystemClient';
import { runSandboxCommand } from '@/services/sandboxClient';
import { useFileSystemStore } from '@/store/useFileSystemStore';
import { useMemoryStore } from '@/store/useMemoryStore';
import { useAiTimelineStore } from '@/store/useAiTimelineStore';

export type ToolDefinition = {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
};

export const AVAILABLE_TOOLS: ToolDefinition[] = [
  {
    name: 'read_file',
    description: 'Read the contents of a file inside the workspace.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'The relative file path to read.' }
      },
      required: ['path']
    }
  },
  {
    name: 'write_file',
    description: 'Propose writing or overwriting code to a workspace file. In Antigravity IDE, this triggers a Diff Preview modal requiring user Accept/Reject.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'The relative target file path.' },
        content: { type: 'string', description: 'The complete code content to write.' }
      },
      required: ['path', 'content']
    }
  },
  {
    name: 'create_folder',
    description: 'Create a new directory in the workspace.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'The relative directory path to create.' }
      },
      required: ['path']
    }
  },
  {
    name: 'delete_file',
    description: 'Delete a file or folder from the workspace.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'The relative path of the file or folder to delete.' }
      },
      required: ['path']
    }
  },
  {
    name: 'search_project',
    description: 'Search for text patterns in the project structure, or retrieve relevant file names.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Simple regex or name filter query.' }
      },
      required: ['query']
    }
  },
  {
    name: 'run_command',
    description: 'Run a development, install, or build validation command in the isolated workspace shell.',
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'The shell command to execute.' }
      },
      required: ['command']
    }
  },
  {
    name: 'retrieve_memory',
    description: 'Retrieve semantically relevant context from workspace memories.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Memory retrieval search query.' }
      },
      required: ['query']
    }
  }
];

export async function executeTool(name: string, args: any, onWriteIntercept?: (path: string, content: string) => Promise<boolean>): Promise<any> {
  const timeline = useAiTimelineStore.getState();

  switch (name) {
    case 'read_file': {
      const path = args.path;
      timeline.addEvent({
        agentId: 'coder',
        icon: '📄',
        title: `Reading File`,
        detail: path,
        status: 'pending'
      });
      try {
        const res = await readWorkspaceFile(path);
        timeline.addEvent({
          agentId: 'coder',
          icon: '📄',
          title: `Read File Success`,
          detail: path,
          status: 'success'
        });
        return { success: true, content: res.content };
      } catch (err: any) {
        timeline.addEvent({
          agentId: 'coder',
          icon: '📄',
          title: `Read File Failed`,
          detail: `${path}: ${err.message}`,
          status: 'failed'
        });
        return { success: false, error: err.message };
      }
    }

    case 'write_file': {
      const { path, content } = args;
      timeline.addEvent({
        agentId: 'coder',
        icon: '📝',
        title: `Proposing File Write`,
        detail: `${path} (${content.length} characters)`,
        status: 'pending'
      });

      // Check if we need to intercept for Diff Approval
      if (onWriteIntercept) {
        try {
          const approved = await onWriteIntercept(path, content);
          if (!approved) {
            timeline.addEvent({
              agentId: 'coder',
              icon: '📝',
              title: `Write Proposal Rejected`,
              detail: path,
              status: 'failed'
            });
            return { success: false, error: 'User rejected the file write modifications.' };
          }
        } catch (err: any) {
          return { success: false, error: `Diff Approval error: ${err.message}` };
        }
      }

      // Write directly if approved or no interceptor
      try {
        await writeWorkspaceFile(path, content);
        timeline.addEvent({
          agentId: 'coder',
          icon: '📝',
          title: `Write File Success`,
          detail: path,
          status: 'success'
        });
        // Sync explorer tree
        await useFileSystemStore.getState().syncFromBackend().catch(() => undefined);
        return { success: true };
      } catch (err: any) {
        timeline.addEvent({
          agentId: 'coder',
          icon: '📝',
          title: `Write File Failed`,
          detail: `${path}: ${err.message}`,
          status: 'failed'
        });
        return { success: false, error: err.message };
      }
    }

    case 'create_folder': {
      const path = args.path;
      timeline.addEvent({
        agentId: 'coder',
        icon: '📁',
        title: `Creating Folder`,
        detail: path,
        status: 'pending'
      });
      try {
        await createWorkspaceFolder(path);
        timeline.addEvent({
          agentId: 'coder',
          icon: '📁',
          title: `Create Folder Success`,
          detail: path,
          status: 'success'
        });
        await useFileSystemStore.getState().syncFromBackend().catch(() => undefined);
        return { success: true };
      } catch (err: any) {
        timeline.addEvent({
          agentId: 'coder',
          icon: '📁',
          title: `Create Folder Failed`,
          detail: `${path}: ${err.message}`,
          status: 'failed'
        });
        return { success: false, error: err.message };
      }
    }

    case 'delete_file': {
      const path = args.path;
      timeline.addEvent({
        agentId: 'coder',
        icon: '🗑️',
        title: `Deleting File`,
        detail: path,
        status: 'pending'
      });
      try {
        await deleteWorkspacePath(path);
        timeline.addEvent({
          agentId: 'coder',
          icon: '🗑️',
          title: `Delete File Success`,
          detail: path,
          status: 'success'
        });
        await useFileSystemStore.getState().syncFromBackend().catch(() => undefined);
        return { success: true };
      } catch (err: any) {
        timeline.addEvent({
          agentId: 'coder',
          icon: '🗑️',
          title: `Delete File Failed`,
          detail: `${path}: ${err.message}`,
          status: 'failed'
        });
        return { success: false, error: err.message };
      }
    }

    case 'search_project': {
      const query = args.query;
      timeline.addEvent({
        agentId: 'planner',
        icon: '🔍',
        title: `Searching Project`,
        detail: `query: "${query}"`,
        status: 'pending'
      });
      try {
        const flatPaths = useFileSystemStore.getState().flattenPaths();
        const results = flatPaths.filter((p) => p.toLowerCase().includes(query.toLowerCase()));
        timeline.addEvent({
          agentId: 'planner',
          icon: '🔍',
          title: `Search Completed`,
          detail: `Found ${results.length} files`,
          status: 'success'
        });
        return { success: true, files: results };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    case 'run_command': {
      const command = args.command;
      timeline.addEvent({
        agentId: 'debug',
        icon: '💻',
        title: `Running Command`,
        detail: command,
        status: 'pending'
      });
      try {
        const res = await runSandboxCommand(command);
        const isSuccess = res.result.status === 'success';
        timeline.addEvent({
          agentId: 'debug',
          icon: '💻',
          title: isSuccess ? `Command Succeeded` : `Command Failed`,
          detail: `${command} (code ${res.result.code})`,
          status: isSuccess ? 'success' : 'failed'
        });
        return { success: true, code: res.result.code, output: res.logs };
      } catch (err: any) {
        timeline.addEvent({
          agentId: 'debug',
          icon: '💻',
          title: `Command Execution Error`,
          detail: `${command}: ${err.message}`,
          status: 'failed'
        });
        return { success: false, error: err.message };
      }
    }

    case 'retrieve_memory': {
      const query = args.query;
      timeline.addEvent({
        agentId: 'planner',
        icon: '🧠',
        title: `Retrieving Memory`,
        detail: query,
        status: 'pending'
      });
      try {
        const memories = await useMemoryStore.getState().searchMemory(query, undefined, 5);
        timeline.addEvent({
          agentId: 'planner',
          icon: '🧠',
          title: `Memory Retrieved`,
          detail: `Retrieved ${memories.length} entries`,
          status: 'success'
        });
        return {
          success: true,
          memories: memories.map((m) => `[${m.layer}] ${m.title}: ${m.content}`)
        };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    default:
      return { success: false, error: `Unknown tool name: ${name}` };
  }
}
