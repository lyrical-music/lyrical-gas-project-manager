/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

function getEnvProperty(key: string) {
  const props = PropertiesService.getScriptProperties();
  const value = props.getProperty(key);
  return value;
}
