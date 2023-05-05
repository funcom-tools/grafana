module github.com/grafana/grafana

go 1.19

// contains go generation fixes
replace github.com/deepmap/oapi-codegen => github.com/spinillos/oapi-codegen v1.12.5-0.20230417081915-2945b61c0b1c

// For some insane reason, client-go seems to have a broken v12.0.0 tag on it that forces us to
// hoist a replace statement.
replace k8s.io/client-go => k8s.io/client-go v0.25.3

require k8s.io/apimachinery v0.26.2

require (
	cloud.google.com/go/storage v1.28.1 // @backend-platform
	cuelang.org/go v0.5.0 // @as-code
	github.com/Azure/azure-sdk-for-go v65.0.0+incompatible // @backend-platform
	github.com/Masterminds/semver v1.5.0 // @delivery @backend-platform
)

require (
	github.com/Azure/azure-sdk-for-go/sdk/internal v1.0.0 // indirect
	github.com/Azure/go-autorest v14.2.0+incompatible // indirect
	github.com/Azure/go-autorest/autorest/date v0.3.0 // indirect
	github.com/Azure/go-autorest/autorest/to v0.4.0 // indirect
)

require (
	cloud.google.com/go/kms v1.4.0 // @backend-platform
	github.com/Azure/azure-sdk-for-go/sdk/azidentity v1.2.0 // @backend-platform
	github.com/Azure/azure-sdk-for-go/sdk/keyvault/azkeys v0.9.0 // @backend-platform
	github.com/Azure/azure-storage-blob-go v0.15.0 // @backend-platform
	github.com/Azure/go-autorest/autorest/adal v0.9.21 // @backend-platform
)

require (
	cloud.google.com/go/compute v1.15.1 // indirect
	cloud.google.com/go/iam v0.8.0 // indirect
	filippo.io/age v1.1.1 // @backend-platform
	github.com/Azure/azure-sdk-for-go/sdk/azcore v1.2.0 // indirect
)

// Use fork of crewjam/saml with fixes for some issues until changes get merged into upstream
replace github.com/crewjam/saml => github.com/grafana/saml v0.4.13-0.20230331080031-67cbfa09c7b6

// Use 1.10.6 of pq to avoid a change in 1.10.7 that has certificate validation issues. https://github.com/grafana/grafana/issues/65816
replace github.com/lib/pq => github.com/lib/pq v1.10.6
