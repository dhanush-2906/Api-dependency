const ComponentType = {
  SERVICE: 'SERVICE',
  APPLICATION: 'APPLICATION',
  DATABASE: 'DATABASE',
  EXTERNAL: 'EXTERNAL'
};

const inferComponentType = (name, declaredType) => {
  if (declaredType) {
    const upper = declaredType.toString().trim().toUpperCase();
    if (upper === 'API' || upper === 'SERVICE') return ComponentType.SERVICE;
    if (upper === 'APPLICATION' || upper === 'APP') return ComponentType.APPLICATION;
    if (upper === 'DATABASE' || upper === 'DB') return ComponentType.DATABASE;
    if (upper === 'EXTERNAL' || upper === 'GATEWAY') return ComponentType.EXTERNAL;
  }

  const cleanName = (name || '').trim().toLowerCase();
  if (cleanName.endsWith(' db') || cleanName.endsWith(' database') || cleanName.includes('db')) {
    return ComponentType.DATABASE;
  }
  if (
    cleanName.endsWith(' portal') ||
    cleanName.endsWith(' console') ||
    cleanName.endsWith(' dashboard') ||
    cleanName.endsWith(' app') ||
    cleanName.includes('portal') ||
    cleanName.includes('console') ||
    cleanName.includes('dashboard')
  ) {
    return ComponentType.APPLICATION;
  }
  if (
    cleanName.endsWith(' gateway') ||
    cleanName.includes('gateway') ||
    cleanName.includes('third party') ||
    cleanName.includes('external')
  ) {
    return ComponentType.EXTERNAL;
  }
  return ComponentType.SERVICE;
};

module.exports = {
  ComponentType,
  inferComponentType
};
