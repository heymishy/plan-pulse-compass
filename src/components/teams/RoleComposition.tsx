import React from 'react';
import { Team } from '@/types';
import { useApp } from '@/context/AppContext';
import { useRoleTypes } from '@/hooks/useRoleTypes';
import {
  calculateRoleCompositionPercentages,
  calculateRoleTypeComposition,
} from '@/utils/teamUtils';

interface RoleCompositionProps {
  team: Team;
  showColorKey?: boolean;
  size?: 'sm' | 'md';
  useRoleTypes?: boolean;
}

const RoleComposition: React.FC<RoleCompositionProps> = ({
  team,
  showColorKey = false,
  size = 'md',
  useRoleTypes = true,
}) => {
  const { people, roles } = useApp();
  const { roleTypes, roleTypeMappings } = useRoleTypes();

  const barHeight = size === 'sm' ? 'h-1.5' : 'h-2';
  const textSize = size === 'sm' ? 'text-xs' : 'text-xs';

  // Use role type composition if enabled and available
  const roleTypeComposition =
    useRoleTypes && roleTypes.length > 0
      ? calculateRoleTypeComposition(
          team.id,
          people,
          roles,
          roleTypes,
          roleTypeMappings
        )
      : null;

  // Fallback to legacy composition
  const legacyComposition = calculateRoleCompositionPercentages(
    team.id,
    people,
    roles
  );

  // Determine what to display
  const hasRoleTypes =
    roleTypeComposition &&
    (roleTypeComposition.roleTypeBreakdown.length > 0 ||
      roleTypeComposition.unmappedBreakdown.length > 0);

  if (hasRoleTypes && roleTypeComposition) {
    // Display role type composition
    const allBreakdown = [
      ...roleTypeComposition.roleTypeBreakdown.map(rt => ({
        name: rt.roleTypeName,
        count: rt.count,
        percentage: rt.percentage,
        color: rt.color,
        isRoleType: true,
      })),
      ...roleTypeComposition.unmappedBreakdown.map(ur => ({
        name: ur.roleName,
        count: ur.count,
        percentage: ur.percentage,
        color: ur.color,
        isRoleType: false,
      })),
    ].sort((a, b) => b.count - a.count);

    // Calculate top role type percentages
    const topRoleTypes = roleTypeComposition.roleTypeBreakdown
      .slice(0, 2)
      .sort((a, b) => b.count - a.count);

    return (
      <div className="space-y-1">
        {/* Top role type percentages */}
        <div className="space-y-0.5">
          {topRoleTypes.map((roleType, index) => (
            <div
              key={roleType.roleTypeId}
              className={`${textSize} text-gray-600`}
            >
              {roleType.percentage}% {roleType.roleTypeName}
            </div>
          ))}
          {roleTypeComposition.unmappedBreakdown.length > 0 && (
            <div className={`${textSize} text-gray-500`}>
              {Math.round(
                (roleTypeComposition.unmappedBreakdown.reduce(
                  (sum, r) => sum + r.count,
                  0
                ) /
                  roleTypeComposition.totalCount) *
                  100
              )}
              % Other
            </div>
          )}
        </div>

        {/* Visual role composition indicator */}
        <div className="flex space-x-0.5">
          {allBreakdown.slice(0, 4).map((item, index) => (
            <div
              key={`${item.name}-${index}`}
              className={`${barHeight} rounded-full`}
              style={{
                width: `${Math.max(item.percentage, 5)}%`,
                backgroundColor: item.color,
              }}
              title={`${item.name}: ${item.count} (${item.percentage}%)${!item.isRoleType ? ' - Unmapped' : ''}`}
            />
          ))}
        </div>

        {/* Color key legend (optional) */}
        {showColorKey && allBreakdown.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="text-xs font-medium text-gray-700 mb-1">
              Role Type Legend:
            </div>
            <div className="space-y-1">
              {allBreakdown.slice(0, 4).map((item, index) => (
                <div
                  key={`legend-${item.name}-${index}`}
                  className="flex items-center gap-2 text-xs"
                >
                  <div
                    className="w-3 h-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-gray-600">
                    {item.name}: {item.count} ({item.percentage}%)
                    {!item.isRoleType && (
                      <span className="text-gray-400 ml-1">(unmapped)</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Fallback to legacy SE/QE display
  return (
    <div className="space-y-1">
      {/* SE/QE percentages */}
      <div className="space-y-0.5">
        <div className={`${textSize} text-gray-600`}>
          {legacyComposition.sePercentage}% SE
        </div>
        <div className={`${textSize} text-gray-600`}>
          {legacyComposition.qePercentage}% QE
        </div>
      </div>

      {/* Visual role composition indicator */}
      <div className="flex space-x-0.5">
        {legacyComposition.roleBreakdown.slice(0, 4).map((role, index) => (
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
      {showColorKey && legacyComposition.roleBreakdown.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="text-xs font-medium text-gray-700 mb-1">
            Role Legend:
          </div>
          <div className="space-y-1">
            {legacyComposition.roleBreakdown.slice(0, 4).map((role, index) => (
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
