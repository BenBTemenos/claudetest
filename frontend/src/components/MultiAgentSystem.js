import React from 'react';
import './MultiAgentSystem.css';

function MultiAgentSystem() {
  return (
    <div className="multi-agent-container">
      <div className="multi-agent-header">
        <div className="header-icon">📊</div>
        <h2>Simple View: Multi-Agent System</h2>
      </div>

      <div className="flowchart">
        {/* Complex Task */}
        <div className="flow-node node-blue">
          <div className="node-content">Complex Task</div>
        </div>

        {/* Arrow */}
        <div className="flow-arrow">
          <div className="arrow-down"></div>
        </div>

        {/* Orchestrator Agent */}
        <div className="flow-node node-orange">
          <div className="node-content">
            <div>Orchestrator Agent</div>
            <div className="node-subtitle">Coordinates team</div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flow-arrow">
          <div className="arrow-down"></div>
        </div>

        {/* Three Agents Row */}
        <div className="agents-row">
          <div className="flow-node node-green">
            <div className="node-content">
              <div>Research</div>
              <div>Agent</div>
            </div>
          </div>

          <div className="flow-node node-purple">
            <div className="node-content">
              <div>Analysis</div>
              <div>Agent</div>
            </div>
          </div>

          <div className="flow-node node-pink">
            <div className="node-content">
              <div>Writing</div>
              <div>Agent</div>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flow-arrow">
          <div className="arrow-down"></div>
        </div>

        {/* Synthesize Results */}
        <div className="flow-node node-orange">
          <div className="node-content">Synthesize Results</div>
        </div>

        {/* Arrow */}
        <div className="flow-arrow">
          <div className="arrow-down"></div>
        </div>

        {/* Complete Solution */}
        <div className="flow-node node-blue">
          <div className="node-content">Complete Solution</div>
        </div>
      </div>
    </div>
  );
}

export default MultiAgentSystem;
