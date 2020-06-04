#!/bin/bash

# Default path ENVs
CLI_PATH=/keg/keg-cli
DOC_APP_PATH=/keg/keg-core
CORE_NM_CACHE=/keg/nm-cache/core

keg_message(){
  echo $"[ KEG-CLI ] $1" >&2
  return
}

# Overwrite the default cli and core paths with passed in ENVs
keg_set_container_paths(){

  if [[ "$DOC_CLI_PATH" ]]; then
    CLI_PATH="$DOC_CLI_PATH"
  fi

  if [[ "$DOC_CORE_PATH" ]]; then
    DOC_APP_PATH="$DOC_CORE_PATH"
  fi
  
  if [[ "$NM_CACHE" ]]; then
    CORE_NM_CACHE="$NM_CACHE"
  fi

}

# Runs yarn install at run time
# Use when adding extra node_modules to keg-core without rebuilding
keg_run_yarn_install(){

  # Check if we should run yarn install
  # Is $NM_INSTALL doesn't exist, just return
  if [[ -z "$NM_INSTALL" || -z "$CORE_NM_CACHE" ]]; then
    return
  fi

  # Navigate to the cached directory, and run the yarn install here
  cd $CORE_NM_CACHE
  keg_message "Running yarn install for keg-core..."
  yarn install

}

# Copies over the locally cached node_modules
keg_copy_node_modules(){
  
  # ensure we know where the node_module cache is
  if [[ -z "$CORE_NM_CACHE" ]]; then
    return
  fi
  
  # Copy recursivly (-R) and don't overwrite anyfiles (-n)
  cp -R -n $CORE_NM_CACHE/node_modules/. $DOC_APP_PATH/node_modules

}

# Runs keg-core application without a tap
keg_run_from_core(){

  cd $DOC_APP_PATH

  # Default to running keg-core in a web-browser
  local KEG_EXEC_CMD="$EXEC_CMD"

  # Set the default yarn command to start
  if [[ -z "$KEG_EXEC_CMD" ]]; then
    KEG_EXEC_CMD="web"
  fi

  keg_message "Running command yarn $KEG_EXEC_CMD"
  yarn $KEG_EXEC_CMD

}

# Set the container paths in case they have been overwritten
keg_set_container_paths

# Run yarn install for any extra node_modules to be installed form the mounted volume
keg_run_yarn_install

# Copies over the locally cached node_modules into the apps node_modules
keg_copy_node_modules

# Start the keg core instance
keg_run_from_core
