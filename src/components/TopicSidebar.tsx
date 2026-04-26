import React, { useState } from 'react';
import { TopicNode } from '../types';
import { ChevronRight, ChevronDown, BookOpen, Folder, Hash, TreeDeciduous } from 'lucide-react';

interface Props {
  data: TopicNode[];
  onSelect: (node: TopicNode, breadcrumbs: string[]) => void;
  selectedNodeId: string | null;
  isOpen: boolean;
  onToggle: () => void;
}

const TopicSidebar: React.FC<Props> = ({ data, onSelect, selectedNodeId, isOpen, onToggle }) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNodes(newExpanded);
  };

  const handleNodeClick = (node: TopicNode, parentPath: string[]) => {
    // If it has children, just toggle expansion
    if (node.children && node.children.length > 0) {
       const newExpanded = new Set(expandedNodes);
       if (newExpanded.has(node.id)) {
         newExpanded.delete(node.id);
       } else {
         newExpanded.add(node.id);
       }
       setExpandedNodes(newExpanded);
    } 
    
    // Always select the node to update the view context
    onSelect(node, [...parentPath, node.title]);
  };

  const renderNode = (node: TopicNode, depth: number = 0, parentPath: string[]) => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNodeId === node.id;
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className="select-none">
        <div 
          onClick={() => handleNodeClick(node, parentPath)}
          className={`
            flex items-center gap-2 px-4 py-2 cursor-pointer transition-colors duration-200
            ${isSelected ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-700'}
            ${depth === 0 ? 'font-semibold border-b border-slate-100' : 'text-sm'}
          `}
          style={{ paddingLeft: `${depth * 16 + 16}px` }}
        >
          {/* Icon based on Type */}
          {node.type === 'grade' && <BookOpen className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-blue-500'}`} />}
          {node.type === 'strand' && <Folder className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-amber-500'}`} />}
          {node.type === 'topic' && <Hash className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-slate-400'}`} />}

          <span className="flex-1 truncate">{node.title}</span>

          {hasChildren && (
            <div onClick={(e) => toggleExpand(e, node.id)} className="p-1 hover:bg-black/10 rounded">
               {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </div>
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="animate-slide-down">
            {node.children!.map(child => renderNode(child, depth + 1, [...parentPath, node.title]))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
         className={`fixed inset-0 bg-black/30 z-30 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
         onClick={onToggle}
      />

      {/* Sidebar Panel */}
      <div className={`
        fixed top-16 left-0 bottom-0 z-40 bg-white border-r border-slate-200 shadow-xl lg:shadow-none lg:static
        transition-all duration-300 ease-in-out flex flex-col
        ${isOpen ? 'w-[300px] translate-x-0' : 'w-[300px] -translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden lg:opacity-0'}
      `}>
         
         {/* Header */}
         <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
            <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
               <TreeDeciduous className="w-5 h-5" />
            </div>
            <div>
               <h2 className="font-bold text-slate-800 text-sm">Topic Explorer</h2>
               <p className="text-xs text-slate-500">Browse curriculum</p>
            </div>
         </div>

         {/* Tree Content */}
         <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
            {data.map(node => renderNode(node, 0, []))}
         </div>

      </div>
    </>
  );
};

export default TopicSidebar;