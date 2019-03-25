import Vue from 'vue';
import { 
	Button, Switch, Card, Icon, Tooltip, InputNumber, Tag, DatePicker, Alert,
	Row, Col, 
	Header, Main, Aside, Container, 
	Menu, MenuItem, Submenu,
	Table, TableColumn,
	Collapse, CollapseItem,
	Breadcrumb, BreadcrumbItem,
	Tabs, TabPane,
	Dropdown, DropdownMenu, DropdownItem 
} from 'element-ui';
import VueApexCharts from 'vue-apexcharts';
import Notifications from 'vue-notification';
import App from './App.vue';

Vue.use(Button);
Vue.use(Switch);
Vue.use(Card);
Vue.use(Icon);
Vue.use(Tooltip);
Vue.use(InputNumber);
Vue.use(Tag);
Vue.use(DatePicker);
Vue.use(Alert);

Vue.use(Row);
Vue.use(Col);

Vue.use(Header);
Vue.use(Main);
Vue.use(Aside);
Vue.use(Container);

Vue.use(Menu);
Vue.use(MenuItem);
Vue.use(Submenu);

Vue.use(Table);
Vue.use(TableColumn);

Vue.use(Collapse);
Vue.use(CollapseItem);

Vue.use(Breadcrumb);
Vue.use(BreadcrumbItem);

Vue.use(Tabs);
Vue.use(TabPane);

Vue.use(Dropdown);
Vue.use(DropdownMenu);
Vue.use(DropdownItem);

Vue.use(VueApexCharts);
Vue.use(Notifications);

new Vue({
	el: '#app',
	components: { App },
	template: "<App/>"
});