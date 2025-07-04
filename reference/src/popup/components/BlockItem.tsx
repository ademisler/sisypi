import React from 'react';
import type { BlockWithStatus, Block } from '../types';
import { getMessage } from '../services/i18n';

interface BlockItemProps {
    block: BlockWithStatus;
    blocks: BlockWithStatus[]; // All blocks for context
    onBlocksChange: (newBlocks: BlockWithStatus[]) => void;
}

const statusIcons = {
    idle: '⚪',
    running: '🔵',
    success: '✅',
    error: '❌'
};

const BlockItem: React.FC<BlockItemProps> = ({ block, blocks, onBlocksChange }) => {
    
    const handleDelete = (blockId: string, parentBlock?: Block) => {
        let newBlocks;
        if (parentBlock) {
             // This is complex, for now, we'll just handle top-level deletion
             newBlocks = blocks.filter(b => b.id !== blockId);
        } else {
            newBlocks = blocks.filter(b => b.id !== blockId);
        }
        onBlocksChange(newBlocks);
    };

    const renderDetails = () => {
        switch(block.type) {
            case 'goToURL': return `"${block.url}"`;
            case 'openTab': return `new tab with "${block.url}"`;
            case 'clickElement': return `selector: "${block.selector}"`;
            case 'typeText': return `"${block.value}" into selector: "${block.selector}"`;
            case 'wait': return `for ${block.duration}ms`;
            case 'waitForElement': return `for selector: "${block.selector}"`;
            case 'copyText': return `from selector: "${block.selector}" into {{${block.saveAsVariable}}}`;
            case 'scroll': return `by ${block.scrollX || 0}px (X), ${block.scrollY || 0}px (Y)`;
            case 'ifElementExists': return `if selector exists: "${block.selector}"`;
            case 'loop': return `for ${block.count} times`;
            case 'closeTab': return `current tab`;
            default:
                const unhandled: never = block.type;
                return `Unknown step: ${unhandled}`;
        }
    }

    const renderNestedBlocks = (nested?: Block[], type?: 'if' | 'else' | 'loop') => {
        // This is a simplified render. A full implementation would need recursive BlockItem calls.
        if (!nested || nested.length === 0) return null;
        return <div className={`nested-blocks ${type}`}>{nested.length} steps</div>
    }

    return (
        <div className="block-item-wrapper">
            <div className={`block-item status-${block.status}`}>
                <span className="status-icon" title={block.error}>{statusIcons[block.status]}</span>
                <span className="type">{block.type}</span>
                <span className="details">{renderDetails()}</span>
                <button 
                    className="delete-block-btn"
                    title={getMessage('deleteStep')}
                    onClick={() => handleDelete(block.id)}
                >
                    &times;
                </button>
            </div>
             {block.type === 'ifElementExists' && (
                <div className="nested-container">
                    <div className="nested-branch if-branch">
                        <strong>IF:</strong>
                        {renderNestedBlocks(block.ifBlocks, 'if')}
                    </div>
                     {block.elseBlocks && (
                        <div className="nested-branch else-branch">
                            <strong>ELSE:</strong>
                           {renderNestedBlocks(block.elseBlocks, 'else')}
                        </div>
                     )}
                </div>
            )}
             {block.type === 'loop' && (
                <div className="nested-container">
                     <div className="nested-branch loop-branch">
                        <strong>DO:</strong>
                        {renderNestedBlocks(block.loopBlocks, 'loop')}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BlockItem;
