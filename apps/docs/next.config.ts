import type { NextConfig } from 'next';
const config: NextConfig = { poweredByHeader: false, agentRules: false, transpilePackages: ['@bld8/ui'], outputFileTracingIncludes: {'/api/starters/*':['./public/downloads/*.zip']} };
export default config;
