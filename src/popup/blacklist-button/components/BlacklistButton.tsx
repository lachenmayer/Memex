import React, { PureComponent } from 'react'
import { connect, MapStateToProps } from 'react-redux'

import Button from '../../components/Button'
import LinkButton from '../../components/LinkButton'
import SplitButton from '../../components/SplitButton'
import { OPTIONS_URL } from '../../constants'
import * as selectors from '../selectors'
import * as popup from '../../selectors'
import * as acts from '../actions'
import { ClickHandler, RootState } from '../../types'

const styles = require('./BlacklistButton.css')

export interface OwnProps {}

interface StateProps {
    shouldShowChoice: boolean
    isDisabled: boolean
    isBlacklisted: boolean
    url: string
}

interface DispatchProps {
    handleBtnClick: ClickHandler<HTMLButtonElement>
    handleBlacklistingChoice: (
        isDomainChoice: boolean,
    ) => ClickHandler<HTMLButtonElement>
}

export type Props = OwnProps & StateProps & DispatchProps

class BookmarkButton extends PureComponent<Props> {
    private renderBlacklisted() {
        return (
            <LinkButton
                href={`${OPTIONS_URL}#/blacklist`}
                itemClass={styles.itemBlacklisted}
                btnClass={styles.itemBtnBlacklisted}
            >
                This Page is Blacklisted. Undo>>
            </LinkButton>
        )
    }

    private renderUnblacklisted() {
        return (
            <Button
                onClick={this.props.handleBtnClick}
                disabled={this.props.isDisabled}
                btnClass={styles.blacklist}
            >
                Blacklist Current Page
            </Button>
        )
    }

    private renderBlacklistChoice() {
        return (
            <SplitButton iconClass={styles.blacklist}>
                <Button onClick={this.props.handleBlacklistingChoice(true)}>
                    Domain
                </Button>
                <Button onClick={this.props.handleBlacklistingChoice(false)}>
                    URL
                </Button>
            </SplitButton>
        )
    }

    render() {
        if (this.props.shouldShowChoice) {
            return this.renderBlacklistChoice()
        }

        if (this.props.isBlacklisted) {
            return this.renderBlacklisted()
        }

        return this.renderUnblacklisted()
    }
}

const mapState: MapStateToProps<StateProps, OwnProps, RootState> = state => ({
    shouldShowChoice: selectors.showBlacklistChoice(state),
    isBlacklisted: selectors.isBlacklisted(state),
    isDisabled: !popup.isLoggable(state),
    url: popup.url(state),
})

const mapDispatch = (dispatch): DispatchProps => ({
    handleBtnClick: event => {
        event.preventDefault()
        dispatch(acts.setShowBlacklistChoice(true))
    },
    handleBlacklistingChoice: isDomainChoice => event => {
        event.preventDefault()
        dispatch(acts.addURLToBlacklist(isDomainChoice))
    },
})

export default connect<StateProps, DispatchProps, OwnProps>(
    mapState,
    mapDispatch,
)(BookmarkButton)
