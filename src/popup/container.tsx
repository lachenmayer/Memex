import React, { PureComponent, KeyboardEventHandler } from 'react'
import qs from 'query-string'
import { connect, MapStateToProps } from 'react-redux'
import { browser } from 'webextension-polyfill-ts'

import analytics from '../analytics'
import extractQueryFilters from '../util/nlp-time-filter'
import { remoteFunction } from '../util/webextensionRPC'
import {
    IndexDropdown,
    AddListDropdownContainer,
} from '../common-ui/containers'
import { Wrapper } from '../common-ui/components'
import Search from './components/Search'
import LinkButton from './components/LinkButton'
import UpgradeButton from './components/UpgradeButton'
import ButtonIcon from './components/ButtonIcon'
import { TooltipButton } from './tooltip-button'
import { NotifButton } from './notif-button'
import { HistoryPauser } from './pause-button'
import { selectors as tags, TagsButton } from './tags-button'
import {
    selectors as collections,
    CollectionsButton,
} from './collections-button'
import {
    selectors as blacklist,
    BlacklistButton,
    BlacklistConfirm,
} from './blacklist-button'
import { BookmarkButton } from './bookmark-button'
import * as selectors from './selectors'
import * as acts from './actions'
import * as constants from './constants'
import { ClickHandler, RootState } from './types'

const btnStyles = require('./components/Button.css')
const styles = require('./components/Popup.css')

export interface OwnProps {}

interface StateProps {
    blacklistConfirm: boolean
    showTagsPicker: boolean
    showCollectionsPicker: boolean
    tabId: number
    url: string
    tags: string[]
    collections: any[]
    searchValue: string
    initTagSuggs: string[]
    initCollSuggs: any[]
}

interface DispatchProps {
    initState: () => Promise<void>
    handleSearchChange: ClickHandler<HTMLInputElement>
}

export type Props = OwnProps & StateProps & DispatchProps

class PopupContainer extends PureComponent<Props> {
    componentDidMount() {
        this.props.initState()
    }

    processEvent = remoteFunction('processEvent')

    closePopup = () => window.close()

    onSearchEnter: KeyboardEventHandler<HTMLInputElement> = event => {
        if (event.key === 'Enter') {
            event.preventDefault()
            analytics.trackEvent({
                category: 'Search',
                action: 'Popup search',
            })

            this.processEvent({
                type: 'searchPopup',
            })

            const queryFilters = extractQueryFilters(this.props.searchValue)
            const queryParams = qs.stringify(queryFilters)

            browser.tabs.create({
                url: `${constants.OVERVIEW_URL}?${queryParams}`,
            }) // New tab with query

            this.closePopup()
        }
    }

    renderChildren() {
        if (this.props.blacklistConfirm) {
            return <BlacklistConfirm />
        }

        if (this.props.showTagsPicker) {
            return (
                <IndexDropdown
                    url={this.props.url}
                    tabId={this.props.tabId}
                    initFilters={this.props.tags}
                    initSuggestions={this.props.initTagSuggs}
                    source="tag"
                />
            )
        }

        if (this.props.showCollectionsPicker) {
            return (
                <AddListDropdownContainer
                    mode="popup"
                    results={this.props.collections}
                    initSuggestions={this.props.initCollSuggs}
                    url={this.props.url}
                />
            )
        }

        return (
            <Wrapper>
                <Search
                    searchValue={this.props.searchValue}
                    onSearchChange={this.props.handleSearchChange}
                    onSearchEnter={this.onSearchEnter}
                />
                <BookmarkButton closePopup={this.closePopup} />
                <TagsButton />
                <CollectionsButton />
                <hr />
                <HistoryPauser />
                <BlacklistButton />
                <hr />
                <TooltipButton closePopup={this.closePopup} />
                <hr />
                <LinkButton
                    btnClass={btnStyles.voteIcon}
                    href="https://worldbrain.io/vote_feature"
                >
                    Vote for Next Features
                </LinkButton>
                <UpgradeButton />
                <ButtonIcon
                    href={`${constants.OPTIONS_URL}#/settings`}
                    icon="settings"
                    className={btnStyles.settingsIcon}
                    btnClass={btnStyles.settings}
                />
                <ButtonIcon
                    href="https://worldbrain.io/help"
                    icon="help"
                    btnClass={btnStyles.help}
                />
                <NotifButton />
            </Wrapper>
        )
    }

    render() {
        return <div className={styles.popup}>{this.renderChildren()}</div>
    }
}

const mapState: MapStateToProps<StateProps, OwnProps, RootState> = state => ({
    tabId: selectors.tabId(state),
    url: selectors.url(state),
    searchValue: selectors.searchValue(state),
    blacklistConfirm: blacklist.showDeleteConfirm(state),
    showCollectionsPicker: collections.showCollectionsPicker(state),
    collections: collections.collections(state),
    initCollSuggs: collections.initCollSuggestions(state),
    showTagsPicker: tags.showTagsPicker(state),
    tags: tags.tags(state),
    initTagSuggs: tags.initTagSuggestions(state),
})

const mapDispatch = (dispatch): DispatchProps => ({
    initState: () => dispatch(acts.initState()),
    handleSearchChange: e => {
        e.preventDefault()
        const input = e.target as HTMLInputElement
        dispatch(acts.setSearchVal(input.value))
    },
})

export default connect<StateProps, DispatchProps, OwnProps>(
    mapState,
    mapDispatch,
)(PopupContainer)
