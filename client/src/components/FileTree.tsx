import { useState, useMemo } from 'react';
import { 
  Folder, 
  FolderOpen, 
  ChevronRight, 
  ChevronDown, 
  FileCode, 
  FileText, 
  File, 
  RefreshCw 
} from 'lucide-react';

export interface FileItem {
  name: string;
  path: string;
  size: number;
}

interface FileTreeProps {
  files: FileItem[];
  onOpenFile: (filePath: string) => void;
  onRefresh: () => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  size?: number;
  children: TreeNode[];
}

function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
    case 'js':
    case 'jsx':
    case 'py':
    case 'json':
    case 'css':
    case 'html':
    case 'yaml':
    case 'yml':
    case 'sh':
    case 'bat':
      return <FileCode className="w-3.5 h-3.5 text-[#0db7ed] shrink-0" />;
    case 'md':
    case 'txt':
    case 'pdf':
    case 'doc':
      return <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
    default:
      return <File className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />;
  }
}

function formatFileSize(bytes?: number): string {
  if (bytes === undefined || bytes === 0) return '0B';
  if (bytes < 1024) return `${bytes}B`;
  return `${(bytes / 1024).toFixed(1)}k`;
}

export default function FileTree({
  files,
  onOpenFile,
  onRefresh,
  isExpanded,
  onToggleExpanded
}: FileTreeProps) {
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());

  // Build recursive tree from flat list of paths
  const tree = useMemo(() => {
    const root: TreeNode = { name: 'root', path: '', isFolder: true, children: [] };

    for (const f of files) {
      const parts = f.path.replace(/\\/g, '/').split('/').filter(Boolean);
      let current = root;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLast = i === parts.length - 1;
        const currentPath = parts.slice(0, i + 1).join('/');

        if (isLast) {
          current.children.push({
            name: part,
            path: f.path,
            isFolder: false,
            size: f.size,
            children: []
          });
        } else {
          let folderNode = current.children.find(c => c.isFolder && c.name === part);
          if (!folderNode) {
            folderNode = {
              name: part,
              path: currentPath,
              isFolder: true,
              children: []
            };
            current.children.push(folderNode);
          }
          current = folderNode;
        }
      }
    }

    // Sort folders first, then files alphabetically
    const sortNodes = (nodes: TreeNode[]) => {
      nodes.sort((a, b) => {
        if (a.isFolder === b.isFolder) {
          return a.name.localeCompare(b.name);
        }
        return a.isFolder ? -1 : 1;
      });
      for (const node of nodes) {
        if (node.isFolder) {
          sortNodes(node.children);
        }
      }
    };
    sortNodes(root.children);

    return root.children;
  }, [files]);

  const toggleFolder = (folderPath: string) => {
    setCollapsedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderPath)) {
        next.delete(folderPath);
      } else {
        next.add(folderPath);
      }
      return next;
    });
  };

  const renderNodes = (nodes: TreeNode[], depth: number = 0) => {
    return nodes.map(node => {
      if (node.isFolder) {
        const isCollapsed = collapsedFolders.has(node.path);
        return (
          <div key={node.path} className="select-none">
            <div
              onClick={() => toggleFolder(node.path)}
              className="flex items-center gap-1.5 py-1 px-1.5 rounded-md hover:bg-[var(--bg-surface-hover)] cursor-pointer text-xs font-semibold text-[var(--text-primary)] transition-colors"
              style={{ paddingLeft: `${depth * 12 + 6}px` }}
            >
              <ChevronRight
                className={`w-3 h-3 text-[var(--text-muted)] transition-transform duration-150 shrink-0 ${
                  isCollapsed ? '' : 'rotate-90'
                }`}
              />
              {isCollapsed ? (
                <Folder className="w-3.5 h-3.5 text-amber-500/80 shrink-0" />
              ) : (
                <FolderOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              )}
              <span className="truncate">{node.name}</span>
            </div>
            {!isCollapsed && (
              <div className="relative">
                <div 
                  className="absolute left-[9px] top-0 bottom-0 w-px bg-[var(--border-subtle)]" 
                  style={{ left: `${depth * 12 + 11}px` }}
                />
                {renderNodes(node.children, depth + 1)}
              </div>
            )}
          </div>
        );
      }

      return (
        <div
          key={node.path}
          onClick={() => onOpenFile(node.path)}
          className="flex items-center justify-between py-1 px-1.5 rounded-md hover:bg-[#0db7ed]/10 hover:border-[#0db7ed]/30 border border-transparent cursor-pointer text-xs transition-colors group select-none"
          style={{ paddingLeft: `${depth * 12 + 18}px` }}
          title={`Click to open ${node.name}`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {getFileIcon(node.name)}
            <span className="font-mono text-[11px] truncate text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
              {node.name}
            </span>
          </div>
          <span className="text-[9px] font-mono text-[var(--text-muted)] shrink-0 ml-1">
            {formatFileSize(node.size)}
          </span>
        </div>
      );
    });
  };

  return (
    <div className="space-y-1.5 pt-2 border-t border-[var(--border-subtle)]">
      {/* Header with expand/collapse and refresh */}
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={onToggleExpanded}
          className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-primary)] flex items-center gap-1"
        >
          <ChevronDown
            className={`w-3 h-3 transition-transform duration-200 ${
              isExpanded ? '' : '-rotate-90'
            }`}
          />
          <span>Workspace Files ({files.length})</span>
        </button>
        <button
          type="button"
          onClick={onRefresh}
          className="text-[9px] text-[#0db7ed] hover:underline flex items-center gap-0.5 cursor-pointer font-bold"
          title="Refresh Workspace Files"
        >
          <RefreshCw className="w-2.5 h-2.5" /> Refresh
        </button>
      </div>

      {/* Collapsible tree container */}
      {isExpanded && (
        <div className="space-y-0.5 max-h-52 overflow-y-auto pr-0.5 scrollbar-thin">
          {files.length === 0 ? (
            <p className="text-[11px] text-[var(--text-muted)] italic px-2 py-1.5 bg-[var(--bg-surface-elevated)] rounded-lg border border-dashed border-[var(--border-subtle)]">
              No files in active session
            </p>
          ) : (
            renderNodes(tree)
          )}
        </div>
      )}
    </div>
  );
}
