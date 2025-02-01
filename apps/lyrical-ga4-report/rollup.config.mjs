import baseConfig from '../../config/rollup.base.mjs';

export default {
  ...baseConfig,
  input: {
    index: 'src/index.ts',
    getCommentDataFromSupabase: 'src/getCommentDataFromSupabase.ts',
    gas: '../../common/gas.ts',
    spreadSheet: '../../common/spreadSheet.ts',
    ga4Report: '../../common/ga4Report.ts',
  },
};
