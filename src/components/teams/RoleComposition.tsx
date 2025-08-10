import React from 'react';
import { Team } from '@/types';
import { useApp } from '@/context/AppContext';
import { calculateRoleCompositionPercentages } from '@/utils/teamUtils';

interface RoleCompositionProps {
  team: Team;
  showColorKey?: boolean;
  size?: 'sm' | 'md';
}

const RoleComposition: React.FC<RoleCompositionProps> = ({
  team,
  showColorKey = false,
  size = 'md',
}) => {
  const { people, roles } = useApp();

  const roleComposition = calculateRoleCompositionPercentages(
    team.id,
    people,
    roles
  );

  const barHeight = size === 'sm' ? 'h-1.5' : 'h-2';
  const textSize = size === 'sm' ? 'text-xs' : 'text-xs';

  return (
    <div className="space-y-1">
      {/* SE/QE percentages */}
      <div className="space-y-0.5">
        <div className={`${textSize} text-gray-600`}>
          {roleComposition.sePercentage}% SE
        </div>
        <div className={`${textSize} text-gray-600`}>
          {roleComposition.qePercentage}% QE
        </div>
      </div>

      {/* Visual role composition indicator */}
      <div className="flex space-x-0.5">
        {roleComposition.roleBreakdown.slice(0, 4).map((role, index) => (
          <div
            key={role.roleName}
            className={`${barHeight} rounded-full ${role.color}`}
            style={{
              width: `${Math.max(role.percentage, 5)}%`,
            }}
            title={`${role.roleName}: ${role.count} (${role.percentage}%)`}
          />
        ))}
      </div>

      {/* Color key legend (optional) */}
      {showColorKey && roleComposition.roleBreakdown.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="text-xs font-medium text-gray-700 mb-1">
            Role Legend:
          </div>
          <div className="space-y-1">
            {roleComposition.roleBreakdown.slice(0, 4).map((role, index) => (
              <div
                key={role.roleName}
                className="flex items-center gap-2 text-xs"
              >
                <div className={`w-3 h-2 rounded-full ${role.color}`}></div>
                <span className="text-gray-600">
                  {role.roleName}: {role.count} ({role.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleComposition;
