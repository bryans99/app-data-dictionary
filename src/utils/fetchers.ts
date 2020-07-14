import React, { useState, useEffect, useContext } from "react"
import { ExtensionContext } from "@looker/extension-sdk-react"
import { Looker31SDK as LookerSDK } from '@looker/sdk/dist/sdk/3.1/methods'
import { ILookmlModel, ILookmlModelExplore } from "@looker/sdk/dist/sdk/4.0/models"

const globalCache: any = {}

export function getCached<T>(key: string): T {
  return globalCache[key]
}

export async function loadCached<T>(
  key: string,
  callback: () => Promise<T>
): Promise<T> {
  if (globalCache[key]) {
    return getCached(key)
  } else {
    const val = await callback()
    /* eslint-disable require-atomic-updates */
    globalCache[key] = val
    return val
  }
}

export const loadCachedExplore = async (
  sdk: LookerSDK,
  modelName: string,
  exploreName: string
) => {
  return loadCached(`${modelName}|${exploreName}`, () =>
    sdk.ok(sdk.lookml_model_explore(modelName, exploreName))
  )
}

export const loadAllModels = async (sdk: LookerSDK) => {
  return loadCached("all_lookml_models", () => sdk.ok(sdk.all_lookml_models()))
}

export function useAllModels() {
  const { coreSDK } = useContext(ExtensionContext)
  const [allModels, allModelsSetter] = useState<ILookmlModel[] | undefined>(undefined)
  useEffect(() => {
    async function fetcher() {
      allModelsSetter(await loadAllModels(coreSDK))
    }
    fetcher()
  }, [coreSDK])
  return allModels
}

export function indexAllExplores (allModels: ILookmlModel[]) {
  const { coreSDK } = useContext(ExtensionContext)
  const [allExplores, allExploresSetter] = useState<ILookmlModelExplore[] | undefined>([])
  const [loadingPercent, loadingPercentSetter] = useState('')
  useEffect(() => {
    async function fetcher() {
      const allExploreNames: {[key: string]: string[]} = {}
      let exploreCount = 0
      for (let model of allModels) {
        for (let explore of model.explores) {
          if (!allExploreNames[model.name]) {
            allExploreNames[model.name] = []
          }

          allExploreNames[model.name].push(explore.name)
          exploreCount++
        }
      }

      let finishedCount = 0
      const allExplores: ILookmlModelExplore[] = []
      for (let modelName of Object.keys(allExploreNames)) {
        for (let exploreName of allExploreNames[modelName])
        try {
          const newAllExplores = [...allExplores, await loadCachedExplore(coreSDK, modelName, exploreName)]
          finishedCount++
          allExploresSetter(newAllExplores)
          loadingPercentSetter(`${finishedCount} / ${exploreCount}`)
        }
        catch (e) {
          console.log('error', e)
          exploreCount--
        }
      }
    }
    fetcher()
  }, [coreSDK, allModels])
  return { loadingPercent, allExplores }
}

export function useExplore(modelName?: string, exploreName?: string) {
  const { coreSDK } = useContext(ExtensionContext)
  const [currentExplore, exploreSetter] = useState<ILookmlModelExplore | undefined>(undefined)
  const [loadingExplore, loadingExploreSetter] = useState(null)
  useEffect(() => {
    async function fetcher() {
      if (modelName && exploreName) {
        loadingExploreSetter(exploreName)
        exploreSetter(await loadCachedExplore(coreSDK, modelName, exploreName))
        loadingExploreSetter(null)
      }
    }
    fetcher()
  }, [coreSDK, modelName, exploreName])
  return { loadingExplore, currentExplore }
}

export const loadModel = async (sdk: LookerSDK, modelName: string) => {
  return (await loadAllModels(sdk)).find(m => m.name === modelName)
}

export async function loadModelDetail(
  sdk: LookerSDK,
  modelName: string
): Promise<DetailedModel> {
  const model = await loadModel(sdk, modelName)
  const explores = await Promise.all(
    model.explores.map(explore => {
      return loadCachedExplore(sdk, model.name, explore.name)
    })
  )
  return {
    model,
    explores
  }
}

export function useModelDetail(modelName?: string) {
  const { coreSDK } = useContext(ExtensionContext)
  const [modelDetail, setModelDetail] = useState<DetailedModel | undefined>(undefined)
  useEffect(() => {
    async function fetcher() {
      if (modelName) {
        setModelDetail(await loadModelDetail(coreSDK, modelName))
      }
    }
    fetcher()
  }, [coreSDK, modelName])
  return modelDetail
}

export interface DetailedModel {
  model: ILookmlModel
  explores: ILookmlModelExplore[]
}
