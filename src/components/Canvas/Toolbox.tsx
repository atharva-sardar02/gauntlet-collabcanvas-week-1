import { TOOLS } from '../../utils/tools';
import type { ToolType } from '../../utils/tools';

interface ToolboxProps {
  selectedTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
}

const Toolbox = ({ selectedTool, onSelectTool }: ToolboxProps) => {
  const tools = TOOLS;

  return (
    <div className="fixed left-4 top-20 bg-gray-800 rounded-xl shadow-2xl p-3 border border-gray-700 z-30">
      <div className="flex flex-col gap-2">
        <div className="text-gray-400 text-xs font-semibold px-2 mb-1">
          TOOLS
        </div>
        
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => onSelectTool(tool.id)}
            className={`
              group relative flex items-center justify-center w-12 h-12 rounded-lg
              transition-all duration-200 ease-out
              ${
                selectedTool === tool.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50 scale-105'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:scale-105'
              }
            `}
            title={tool.name}
          >
            <span className="text-2xl">{tool.icon}</span>
            
            {/* Tooltip */}
            <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-xl border border-gray-700">
              <div className="font-semibold">{tool.name}</div>
              <div className="text-gray-400 text-xs">{tool.description}</div>
            </div>
          </button>
        ))}
      </div>
      
      {/* Keyboard shortcuts hint */}
      <div className="mt-4 pt-3 border-t border-gray-700">
        <div className="text-gray-500 text-[10px] px-2 space-y-1">
          {tools.map((tool) => tool.shortcut && (
            <div key={tool.id} className="flex items-center gap-2">
              <kbd className="bg-gray-900 px-1.5 py-0.5 rounded text-[9px] font-semibold">
                {tool.shortcut}
              </kbd>
              <span>{tool.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Toolbox;

