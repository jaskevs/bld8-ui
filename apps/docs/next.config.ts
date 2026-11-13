import type { NextConfig } from 'next';
const config: NextConfig = { poweredByHeader: false, agentRules: false, transpilePackages: ['@bld8/ui'], outputFileTracingIncludes: {'/docs/versions/*':['./public/agent/catalog.json'],'/docs/versions/*/markdown':['./public/agent/catalog.json'],'/api/starters/*':['./public/downloads/*.zip']} };
export default config;
