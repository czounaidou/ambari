/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.apache.ambari.view.hive.resources.resources;

import org.apache.ambari.view.ViewContext;
import org.apache.ambari.view.hive.persistence.utils.FilteringStrategy;
import org.apache.ambari.view.hive.persistence.utils.ItemNotFound;
import org.apache.ambari.view.hive.resources.PersonalCRUDResourceManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

/**
 * Object that provides CRUD operations for resource objects
 */
public class FileResourceResourceManager extends PersonalCRUDResourceManager<FileResourceItem> {
  private final static Logger LOG =
      LoggerFactory.getLogger(FileResourceResourceManager.class);

  /**
   * Constructor
   * @param context View Context instance
   */
  public FileResourceResourceManager(ViewContext context) {
    super(FileResourceItem.class, context);
  }

  @Override
  public FileResourceItem create(FileResourceItem object) {
    return super.create(object);
  }

  @Override
  public FileResourceItem read(Integer id) throws ItemNotFound {
    return super.read(id);
  }

  @Override
  public void delete(Integer resourceId) throws ItemNotFound {
    super.delete(resourceId);
  }

  @Override
  public List<FileResourceItem> readAll(FilteringStrategy filteringStrategy) {
    return super.readAll(filteringStrategy);
  }
}
