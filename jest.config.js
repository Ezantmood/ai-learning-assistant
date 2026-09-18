module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    // Icon thật tải font bất đồng bộ làm crash worker Jest sau teardown;
    // stub đồng bộ cho cả import root lẫn subpath (xem vectorIconsMock).
    '^@expo/vector-icons(/.*)?$': '<rootDir>/src/test-utils/vectorIconsMock.tsx',
  },
};
