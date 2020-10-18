import React, { Component } from 'react'
import { Card, Button, Table, Tag } from 'antd'
import moment from 'moment'
import XLSX from 'xlsx'
import { getArticles } from '../../requests'

const ButtonGroup = Button.Group

const titleDisplayMap = {
    id: 'ID',
    title: 'Title',
    author: 'Author',
    createAt: 'Create',
    amount: 'Amount'
}

export default class ArticleList extends Component {
    constructor() {
        super()
        this.state = {
            dataSource: [],
            columns: [],
            total: 0,
            isLoading: false,
            offset: 0,
            limited: 10
        }
    }

    createColumns = (columnKeys) => {
        const columns = columnKeys.map(item => {
            if(item === 'amount') {
                /* render element color by amount */
                return {
                    title: titleDisplayMap[item],
                    key: item,
                    render: (text, record) => {
                        const { amount } = record
                        return <Tag color={amount > 200 ? "red" : "green"}>{record.amount}</Tag>
                    }
                }
                /* render element color by role */
                // const titleMap = {
                //     '001': 'red',
                //     '002': '#09f',
                //     '003': 'green'
                // }
                // return <Tag color={titleMap[titleKey]}>{record.title}</Tag>
                // ...
            }
            if(item === 'createAt') {
                return {
                    title: titleDisplayMap[item],
                    key: item,
                    render: (text, record) => {
                        const { createAt } = record
                        return moment(parseInt(createAt)).format('MM/DD/YYYY HH:mm:ss')
                    }
                }
            }
            return {
                title: titleDisplayMap[item],
                dataIndex: item,
                key: item,
            }
        })
        columns.push({
            title: 'Actions',
            key: 'actions',
            render: () => {
                return (
                    <ButtonGroup>
                        <Button size="small" type="primary">Edit</Button>
                        <Button size="small" type="danger">Delete</Button>
                    </ButtonGroup>
                )
            }
        })
        return columns
    }

    getData = () => {
        this.setState({
            isLoading: true
        })
        getArticles(this.state.offset, this.state.limited)
            .then(resp => {
                const columnKeys = Object.keys(resp.list[0])
                const columns = this.createColumns(columnKeys)
                this.setState({
                    total: resp.total,
                    dataSource: resp.list,
                    isLoading: false,
                    columns
                })
            })
            .catch(err => {
                // error handling
            })
            .finally(() => {
                this.setState({
                    isLoading: false
                })
            })
    }

    onPageChange = (page, pageSize) => {
        this.setState({
            offset: pageSize * (page - 1),
            limited: pageSize
        }, () => {
            this.getData()
        })
    }

    onShowSizeChange = (current, size) => {
        this.setState({
            offset: 0,
            limited: size
        }, () => {
            this.getData()
        })
    }

    toExcel = () => {
        const data = []
        data.push([
            titleDisplayMap.id,
            titleDisplayMap.title,
            titleDisplayMap.author,
            titleDisplayMap.amount,
            titleDisplayMap.createAt
        ])
        for(let i = 0; i < this.state.dataSource.length; i++) {
            data.push([
                this.state.dataSource[i].id,
                this.state.dataSource[i].title,
                this.state.dataSource[i].author,
                this.state.dataSource[i].amount,
                moment(this.state.dataSource[i].createAt).format('MM/DD/YYYY HH:mm:ss')
            ])
        }
		/* convert state to workbook */
		const ws = XLSX.utils.aoa_to_sheet(data);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, "SheetJS");
		/* generate XLSX file and send to client */
		XLSX.writeFile(wb, `sheetjs-${moment().format('YYYYMMDDHHmmss')}.xlsx`)
    }

    componentDidMount() {
        this.getData()
    }

    render() {
        return (
            <div>
                <Card 
                    title="Article List" 
                    bordered={false} 
                    extra={<Button onClick={this.toExcel}>Export EXCEL</Button>}
                >
                    <Table 
                        rowKey={record => record.id}
                        dataSource={this.state.dataSource} 
                        columns={this.state.columns}
                        loading={this.state.isLoading}
                        pagination={{
                            total: this.state.total,
                            hideOnSinglePage: true,
                            showQuickJumper: true,
                            showSizeChanger: true,
                            onChange: this.onPageChange,
                            onShowSizeChange: this.onShowSizeChange
                        }}
                    />
                </Card>
            </div>
        )
    }
}