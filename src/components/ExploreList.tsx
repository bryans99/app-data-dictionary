import React, { useState } from "react"
import {
  MenuList,
  MenuItem,
  MenuGroup,
  Text,
  palette,
  Box,
  InputText
} from "@looker/components"
import {
  internalExploreURL,
  useCurrentModel,
  usePathNames,
  relationshipsURL
} from "../utils/routes"
import { useHistory } from "react-router-dom"
import { SearchResults } from "./SearchResults"
import { useDebounce } from "use-debounce/lib"
import styled from "styled-components"

const notHidden = (explore: { hidden?: boolean }) => !explore.hidden

const menuCustomizations = {
  bg: "#f5f5f5",
  color: palette.charcoal500,
  iconColor: palette.purple300,
  iconSize: 40,
  marker: {
    color: palette.purple300,
    size: 10
  },
  hover: {
    bg: palette.charcoal100,
    color: palette.charcoal700
  },
  current: {
    bg: palette.charcoal200,
    color: palette.charcoal700
  }
}

const GlobalSearch = styled(InputText)`
  width: 100%;
`

export const ExploreList: React.FC = props => {
  const history = useHistory()
  const currentModel = useCurrentModel()
  const { exploreName, isRelationships } = usePathNames()
  const [search, setSearch] = useState("")
  const [debouncedSearch] = useDebounce(search, 100, { leading: true })

  return (
    <MenuList customizationProps={menuCustomizations}>
      <Box m="medium" mb="none">
        <Text fontWeight="extraBold" fontSize="large">
          Data Dictionary
        </Text>
      </Box>
      {props.children}
      {currentModel && (
        <>
          <MenuGroup label="Information" key="model">
            <MenuItem
              current={isRelationships}
              key="relationships"
              onClick={() =>
                history.push(
                  relationshipsURL({
                    model: currentModel.name
                  })
                )
              }
            >
              Relationships
            </MenuItem>
          </MenuGroup>
        </>
      )}
    </MenuList>
  )
}
