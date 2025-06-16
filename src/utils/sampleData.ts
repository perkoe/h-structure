import { HierarchyNode } from '../types/hierarchy';
import { calculateNodeValue } from './hierarchyCalculations';

export const sampleHierarchy: HierarchyNode = {
  id: 'root',
  name: 'Total Revenue',
  status: 'normal',
  calculatedValue: 0,
  depth: 0,
  children: [
    {
      id: 'q3',
      name: 'Q3',
      status: 'normal',
      calculatedValue: 0,
      depth: 1,
      children: [
        {
          id: 'jul',
          name: 'Jul',
          value: 113.4,
          status: 'normal',
          calculatedValue: 113.4,
          depth: 2
        },
        {
          id: 'aug',
          name: 'Aug',
          value: 46.4,
          status: 'normal',
          calculatedValue: 46.4,
          depth: 2
        },
        {
          id: 'sep',
          name: 'Sep',
          value: 42.7,
          status: 'normal',
          calculatedValue: 42.7,
          depth: 2
        }
      ]
    },
    {
      id: 'q4',
      name: 'Q4',
      status: 'normal',
      calculatedValue: 0,
      depth: 1,
      children: [
        {
          id: 'oct',
          name: 'Oct',
          value: 115.5,
          status: 'normal',
          calculatedValue: 115.5,
          depth: 2
        },
        {
          id: 'nov',
          name: 'Nov',
          value: 24.8,
          status: 'normal',
          calculatedValue: 24.8,
          depth: 2
        },
        {
          id: 'dec',
          name: 'Dec',
          value: 97.2,
          status: 'normal',
          calculatedValue: 97.2,
          depth: 2
        }
      ]
    }
  ]
};

// Initialize calculated values
function initializeCalculatedValues(node: HierarchyNode): void {
  if (node.children) {
    node.children.forEach(initializeCalculatedValues);
  }
  node.calculatedValue = calculateNodeValue(node);
}

initializeCalculatedValues(sampleHierarchy);

export const largeSampleHierarchy: HierarchyNode = {
  id: 'large-root',
  name: '5-Year Summary',
  status: 'normal',
  calculatedValue: 0,
  depth: 0,
  children: Array.from({ length: 5 }, (_, fiveYearIndex) => ({
    id: `year-${2020 + fiveYearIndex}`,
    name: `Year ${2020 + fiveYearIndex}`,
    status: 'normal' as const,
    calculatedValue: 0,
    depth: 1,
    children: Array.from({ length: 4 }, (_, quarterIndex) => ({
      id: `year-${2020 + fiveYearIndex}-q${quarterIndex + 1}`,
      name: `Q${quarterIndex + 1}`,
      status: 'normal' as const,
      calculatedValue: 0,
      depth: 2,
      children: Array.from({ length: 3 }, (_, monthIndex) => ({
        id: `year-${2020 + fiveYearIndex}-q${quarterIndex + 1}-m${monthIndex + 1}`,
        name: `Month ${quarterIndex * 3 + monthIndex + 1}`,
        status: 'normal' as const,
        calculatedValue: 0,
        depth: 3,
        children: Array.from({ length: 30 }, (_, dayIndex) => ({
          id: `year-${2020 + fiveYearIndex}-q${quarterIndex + 1}-m${monthIndex + 1}-d${dayIndex + 1}`,
          name: `Day ${dayIndex + 1}`,
          value: Math.random() * 1000 + 100,
          status: 'normal' as const,
          calculatedValue: 0,
          depth: 4
        }))
      }))
    }))
  }))
};

initializeCalculatedValues(largeSampleHierarchy);

export function createMassiveDataset(): HierarchyNode {
  const massiveHierarchy: HierarchyNode = {
    id: 'massive-root',
    name: 'Enterprise Dataset (~10K nodes)',
    status: 'normal',
    calculatedValue: 0,
    depth: 0,
    children: Array.from({ length: 5 }, (_, regionIndex) => ({
      id: `region-${regionIndex}`,
      name: `Region ${regionIndex + 1}`,
      status: 'normal' as const,
      calculatedValue: 0,
      depth: 1,
      children: Array.from({ length: 10 }, (_, divisionIndex) => ({
        id: `region-${regionIndex}-division-${divisionIndex}`,
        name: `Division ${divisionIndex + 1}`,
        status: 'normal' as const,
        calculatedValue: 0,
        depth: 2,
        children: Array.from({ length: 10 }, (_, teamIndex) => ({
          id: `region-${regionIndex}-division-${divisionIndex}-team-${teamIndex}`,
          name: `Team ${teamIndex + 1}`,
          status: 'normal' as const,
          calculatedValue: 0,
          depth: 3,
          children: Array.from({ length: 20 }, (_, memberIndex) => ({
            id: `region-${regionIndex}-division-${divisionIndex}-team-${teamIndex}-member-${memberIndex}`,
            name: `Member ${memberIndex + 1}`,
            value: Math.random() * 10000 + 1000,
            status: 'normal' as const,
            calculatedValue: 0,
            depth: 4
          }))
        }))
      }))
    }))
  };

  initializeCalculatedValues(massiveHierarchy);
  return massiveHierarchy;
}